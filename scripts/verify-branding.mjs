#!/usr/bin/env node
// Runtime branding verification: runs real `ramu` commands and (optionally)
// inspects a live dashboard, failing on any upstream-name leak that is not an
// allow-listed technical identifier (env var, state dir, package scope, docs URL).
//
//   node scripts/verify-branding.mjs [--all-commands] [--gateway http://127.0.0.1:PORT] [--json out.json]
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { BRAND } from "../branding/brand.mjs";
import { ALLOWED_IDENTIFIERS, PRODUCT_NAME_PATTERN } from "../branding/rules.mjs";

const RAMU_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BIN = path.join(RAMU_ROOT, "bin", "ramu.mjs");

export function findLeaks(text) {
  let scrubbed = text.replace(/\x1b\[[0-9;]*m/g, "");
  for (const allowed of ALLOWED_IDENTIFIERS) scrubbed = scrubbed.replace(allowed, " ");
  const leaks = [];
  for (const match of scrubbed.matchAll(/openclaw|🦞/gi)) {
    leaks.push(scrubbed.slice(Math.max(0, match.index - 40), match.index + 40).replace(/\s+/g, " ").trim());
  }
  return leaks;
}

function run(args) {
  const result = spawnSync(process.execPath, [BIN, ...args], {
    cwd: RAMU_ROOT,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1", COLUMNS: "200" },
    timeout: 180_000,
  });
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

function parseCommands(help) {
  const commands = [];
  let inCommands = false;
  for (const line of help.split("\n")) {
    if (/^Commands:/.test(line)) inCommands = true;
    else if (inCommands && /^\S/.test(line)) break;
    else if (inCommands) {
      const match = line.match(/^ {2}([a-z][a-z0-9-]*)(?: \*)? {2,}/);
      if (match) commands.push(match[1]);
    }
  }
  return commands;
}

// node:http rather than fetch: fetch decodes Content-Encoding itself, which would
// hide whether the precompressed .br/.gz files on disk match their sources.
function fetchText(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get(new URL(url), { headers: { "Accept-Encoding": "identity", ...headers }, timeout: 90_000 }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(chunks);
        const encoding = res.headers["content-encoding"];
        const body = encoding === "br" ? zlib.brotliDecompressSync(raw) : encoding === "gzip" ? zlib.gunzipSync(raw) : raw;
        resolve({ status: res.statusCode, text: body.toString("utf8"), encoding, buf: body });
      });
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

async function verifyDashboard(base, checks) {
  const root = await fetchText(base);
  checks.push({
    surface: "dashboard: <title>",
    ok: root.status === 200 && root.text.includes(`<title>${BRAND.product}</title>`),
    detail: root.text.match(/<title>[^<]*<\/title>/)?.[0] ?? `HTTP ${root.status}`,
  });
  const manifest = await fetchText(new URL("manifest.webmanifest", base));
  let manifestName;
  try {
    manifestName = JSON.parse(manifest.text).name;
  } catch {
    manifestName = undefined;
  }
  checks.push({ surface: "dashboard: web manifest", ok: manifestName === BRAND.product, detail: manifestName });
  const favicon = await fetchText(new URL("favicon.svg", base));
  checks.push({
    surface: "dashboard: favicon",
    ok: favicon.buf.equals(readFileSync(path.join(RAMU_ROOT, "branding", "assets", "icon.svg"))),
    detail: `${favicon.buf.length} bytes`,
  });

  // Every boot script, fetched both compressed and plain: must decode to the same
  // bytes (proves .br/.gz were regenerated) and contain no product-name prose.
  const scripts = [...root.text.matchAll(/(?:src|href)="\.\/(assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  let proseLeaks = 0;
  let mismatched = 0;
  for (const script of scripts) {
    const url = new URL(script, base);
    const plain = await fetchText(url, { "Accept-Encoding": "identity" });
    const br = await fetchText(url, { "Accept-Encoding": "br" });
    if (!plain.buf.equals(br.buf)) mismatched++;
    PRODUCT_NAME_PATTERN.lastIndex = 0;
    proseLeaks += (plain.text.match(PRODUCT_NAME_PATTERN) ?? []).length;
  }
  checks.push({
    surface: `dashboard: ${scripts.length} boot scripts (plain vs br)`,
    ok: scripts.length > 0 && mismatched === 0 && proseLeaks === 0,
    detail: `${mismatched} encoding mismatches, ${proseLeaks} product-name leaks`,
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const allCommands = argv.includes("--all-commands");
  const gateway = argv.includes("--gateway") ? argv[argv.indexOf("--gateway") + 1] : undefined;
  const jsonOut = argv.includes("--json") ? argv[argv.indexOf("--json") + 1] : undefined;
  const checks = [];

  const version = run(["--version"]);
  checks.push({
    surface: "ramu --version",
    ok: version.startsWith(`${BRAND.product} `) && findLeaks(version).length === 0,
    detail: version.trim().split("\n")[0],
  });

  const help = run(["--help"]);
  const helpLeaks = findLeaks(help);
  checks.push({
    surface: "ramu --help",
    ok: /Usage: ramu /.test(help) && help.includes(BRAND.tagline) && helpLeaks.length === 0,
    detail: helpLeaks.length ? helpLeaks.slice(0, 5) : "clean",
  });

  const commands = allCommands ? parseCommands(help) : ["setup", "onboard", "channels", "gateway", "doctor", "dashboard", "plugins"];
  for (const command of commands) {
    const out = run([command, "--help"]);
    const leaks = findLeaks(out);
    checks.push({
      surface: `ramu ${command} --help`,
      ok: out.includes("Usage: ramu ") && leaks.length === 0,
      detail: leaks.length ? leaks.slice(0, 3) : "clean",
    });
  }

  if (gateway) {
    try {
      await verifyDashboard(gateway.endsWith("/") ? gateway : `${gateway}/`, checks);
    } catch (error) {
      checks.push({ surface: "dashboard: reachable", ok: false, detail: error.cause?.code ?? error.message });
    }
  }

  let failed = 0;
  for (const check of checks) {
    if (!check.ok) failed++;
    const detail = Array.isArray(check.detail) ? check.detail.join(" | ") : check.detail;
    console.log(`${check.ok ? "✓" : "✗"} ${check.surface.padEnd(44)} ${detail ?? ""}`);
  }
  console.log(`\n${checks.length - failed}/${checks.length} branding checks passed.`);
  if (jsonOut) writeFileSync(jsonOut, `${JSON.stringify({ checks, failed }, null, 2)}\n`);
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
