#!/usr/bin/env node
// Upstream engine tracking for AI RAMU.
//
//   node scripts/upstream.mjs check              # is a newer stable engine on npm?
//   node scripts/upstream.mjs update [--version X] [--skip-smoke]
//                                                 # pin, install, rebrand, test; restore on failure
//   node scripts/upstream.mjs rollback            # return to the last known-good engine
//   node scripts/upstream.mjs record <result> [--detail text]
//
// Only the `latest` dist-tag (stable) is tracked; betas are ignored. State lives in
// upstream/status.json (current + last known-good) and upstream/history.jsonl.
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ENGINE } from "../branding/brand.mjs";
import { readEngineInfo } from "../lib/engine.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PKG = path.join(ROOT, "package.json");
const LOCK = path.join(ROOT, "package-lock.json");
const STATUS = path.join(ROOT, "upstream", "status.json");
const HISTORY = path.join(ROOT, "upstream", "history.jsonl");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const readJson = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : fallback);
const writeJson = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const pinned = () => readJson(PKG).dependencies[ENGINE.packageName];

function npmRun(args, opts = {}) {
  return spawnSync(npm, args, { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32", ...opts });
}

export function latestUpstream() {
  const out = execFileSync(npm, ["view", ENGINE.packageName, "dist-tags.latest", "time", "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  const data = JSON.parse(out);
  const version = data["dist-tags.latest"];
  return { version, publishedAt: data.time?.[version] };
}

function setOutput(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  for (const [key, value] of Object.entries(values)) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

function record(entry) {
  const status = readJson(STATUS, {});
  const next = { ...status, ...entry, checkedAt: new Date().toISOString() };
  writeJson(STATUS, next);
  appendFileSync(HISTORY, `${JSON.stringify({ at: next.checkedAt, ...entry })}\n`);
  return next;
}

function step(label, args, env = {}) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(process.execPath, args, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...env } });
  return { label, ok: result.status === 0 };
}

async function check() {
  const latest = latestUpstream();
  const current = pinned();
  const update = latest.version !== current;
  console.log(`Pinned engine: ${current}\nLatest stable: ${latest.version} (published ${latest.publishedAt ?? "?"})`);
  console.log(update ? "→ Update available." : "→ Up to date; nothing to do.");
  setOutput({ update: String(update), version: latest.version, current });
  return 0;
}

async function update(args) {
  const target = args.includes("--version") ? args[args.indexOf("--version") + 1] : latestUpstream().version;
  const previous = pinned();
  if (target === previous && !args.includes("--force")) {
    console.log(`Already on ${target}.`);
    return 0;
  }
  console.log(`Updating engine ${previous} → ${target}`);
  copyFileSync(PKG, `${PKG}.bak`);
  if (existsSync(LOCK)) copyFileSync(LOCK, `${LOCK}.bak`);

  const checks = [];
  const install = npmRun(["install", `${ENGINE.packageName}@${target}`, "--save-exact", "--no-audit", "--no-fund"]);
  checks.push({ label: "npm install (postinstall applies branding)", ok: install.status === 0 });
  if (checks.every((c) => c.ok)) checks.push(step("rebrand apply", ["scripts/rebrand-engine.mjs", "apply"]));
  if (checks.every((c) => c.ok)) checks.push(step("rebrand check (rules + integrity)", ["scripts/rebrand-engine.mjs", "check"]));
  if (checks.every((c) => c.ok)) checks.push(step("unit tests", ["--test", "test/*.test.mjs"]));
  if (checks.every((c) => c.ok)) checks.push(step("CLI branding verification", ["scripts/verify-branding.mjs", "--all-commands"]));
  if (checks.every((c) => c.ok) && !args.includes("--skip-smoke")) checks.push(step("gateway smoke test", ["scripts/smoke.mjs"]));

  const ok = checks.every((c) => c.ok);
  const info = readEngineInfo();
  if (!ok) {
    console.error(`\n✗ Engine ${target} failed: ${checks.filter((c) => !c.ok).map((c) => c.label).join(", ")}. Restoring ${previous}.`);
    copyFileSync(`${PKG}.bak`, PKG);
    if (existsSync(`${LOCK}.bak`)) copyFileSync(`${LOCK}.bak`, LOCK);
    npmRun(["install", "--no-audit", "--no-fund"]);
    record({ result: "held", upstream: { version: target }, engine: { version: previous }, checks });
    setOutput({ result: "held" });
    return 1;
  }
  const status = readJson(STATUS, {});
  record({
    result: "updated",
    upstream: { version: target, commit: info?.commit },
    engine: { version: target, commit: info?.commit },
    lastKnownGood: { version: target, commit: info?.commit },
    previousKnownGood: status.lastKnownGood ?? { version: previous },
    checks,
  });
  setOutput({ result: "updated", version: target });
  console.log(`\n✓ Engine ${target} passed all checks.`);
  return 0;
}

async function rollback() {
  const status = readJson(STATUS, {});
  const target = status.previousKnownGood?.version;
  if (!target) {
    console.error("No previous known-good engine recorded. Use `git revert` on the sync commit instead.");
    return 1;
  }
  console.log(`Rolling engine back ${pinned()} → ${target}`);
  const install = npmRun(["install", `${ENGINE.packageName}@${target}`, "--save-exact", "--no-audit", "--no-fund"]);
  if (install.status !== 0) return 1;
  record({ result: "rolled-back", engine: { version: target }, lastKnownGood: status.previousKnownGood });
  return 0;
}

const [command = "check", ...rest] = process.argv.slice(2);
const handlers = {
  check,
  update: () => update(rest),
  rollback,
  record: async () => {
    record({ result: rest[0], detail: rest.includes("--detail") ? rest[rest.indexOf("--detail") + 1] : undefined });
    return 0;
  },
};
if (!handlers[command]) {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
process.exit(await handlers[command]());
