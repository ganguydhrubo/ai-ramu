#!/usr/bin/env node
// AI RAMU rebrand engine.
//
// Applies branding/rules.mjs to the installed upstream engine package
// (node_modules/openclaw) and keeps the dashboard's integrity metadata consistent
// (asset-manifest sha256 + generation, precompressed .br/.gz copies and the
// service worker's offline boot graph).
//
//   node scripts/rebrand-engine.mjs apply [--if-needed] [--quiet]
//   node scripts/rebrand-engine.mjs check      # exit 1 unless fully branded
//   node scripts/rebrand-engine.mjs report     # list every pending replacement
//   (all accept --engine <dir> to target another engine copy)
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import zlib from "node:zlib";
import {
  buildCommandHintPattern,
  FALLBACK_COMMANDS,
  parseRootCommands,
  replaceCommandHints,
  replaceProductName,
  TARGETED_RULES,
  UI_ICON_FILES,
  UI_MANIFEST_PATCH,
  widenRegexPrefixes,
} from "../branding/rules.mjs";
import { readBrandingStamp, readEngineInfo, resolveEngineRoot, STAMP_FILENAME } from "../lib/engine.mjs";

const RAMU_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS_DIR = path.join(RAMU_ROOT, "branding", "assets");

const sha256Hex = (buf) => createHash("sha256").update(buf).digest("hex");
const sha256B64 = (buf) => createHash("sha256").update(buf).digest("base64");

/** Hash of everything that determines the branded output. */
export function computeRulesHash() {
  const hash = createHash("sha256");
  for (const file of ["branding/brand.mjs", "branding/rules.mjs", "scripts/rebrand-engine.mjs"]) {
    hash.update(readFileSync(path.join(RAMU_ROOT, file)));
  }
  for (const icon of UI_ICON_FILES) hash.update(readFileSync(path.join(ASSETS_DIR, icon.source)));
  return hash.digest("hex").slice(0, 16);
}

function* walk(dir, { skipDirs = [] } = {}) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || skipDirs.includes(full)) continue;
      yield* walk(full, { skipDirs });
    } else {
      yield full;
    }
  }
}

const CONTENT_INVENTORY = "dist/postinstall-content-inventory.json";
const NON_TEXT_JSON = new Set([
  "postinstall-content-inventory.json",
  "postinstall-inventory.json",
  "runtime-dependency-ownership.json",
  "build-info.json",
  "package.json",
]);

const toPosix = (rel) => rel.split(path.sep).join("/");

/**
 * The engine ships dist/postinstall-content-inventory.json (sha256 + size of every
 * dist file) and `doctor` / update activation compare it with the files on disk.
 * AI RAMU distributes a modified dist, so the inventory is regenerated for every
 * file the rebrand touched. `paths` limits the scan; omit it to verify everything.
 */
export function syncContentInventory(engineRoot, { paths, dryRun = false } = {}) {
  const file = path.join(engineRoot, CONTENT_INVENTORY);
  if (!existsSync(file)) return { changed: 0, checked: 0 };
  const raw = readFileSync(file, "utf8");
  const entries = JSON.parse(raw);
  let changed = 0;
  let checked = 0;
  for (const entry of entries) {
    if (paths && !paths(entry.path)) continue;
    const target = path.join(engineRoot, ...entry.path.split("/"));
    if (!existsSync(target)) continue;
    checked++;
    const buf = readFileSync(target);
    const digest = sha256Hex(buf);
    if (digest !== entry.sha256 || buf.length !== entry.size) {
      entry.sha256 = digest;
      entry.size = buf.length;
      changed++;
    }
  }
  if (changed && !dryRun) {
    writeFileSync(file, `${JSON.stringify(entries, null, 2)}${raw.endsWith("\n") ? "\n" : ""}`);
  }
  return { changed, checked };
}

function collectTargets(engineRoot) {
  const dist = path.join(engineRoot, "dist");
  const uiRoot = path.join(dist, "control-ui");
  // Root launcher: serves the `--version` fast path before dist/ loads.
  const cli = [path.join(engineRoot, "openclaw.mjs")].filter((file) => existsSync(file));
  for (const file of walk(dist, { skipDirs: [uiRoot] })) {
    const name = path.basename(file);
    if (/\.(?:mjs|js)$/.test(name)) cli.push(file);
    // Text metadata such as plugin manifests and the pre-rendered help. Integrity
    // and dependency inventories are bookkeeping, never user-facing.
    else if (name.endsWith(".json") && !NON_TEXT_JSON.has(name)) cli.push(file);
  }
  const ui = existsSync(path.join(uiRoot, "assets"))
    ? readdirSync(path.join(uiRoot, "assets"))
        .filter((name) => name.endsWith(".js"))
        .map((name) => path.join(uiRoot, "assets", name))
    : [];
  const uiHtml = existsSync(path.join(uiRoot, "index.html")) ? [path.join(uiRoot, "index.html")] : [];
  return { dist, uiRoot, scopes: { cli, ui, "ui-html": uiHtml } };
}

/** Command names from the engine's own root help, so new upstream commands are covered. */
export function resolveCommandPattern(dist) {
  try {
    const metadata = JSON.parse(readFileSync(path.join(dist, "cli-startup-metadata.json"), "utf8"));
    const commands = parseRootCommands(metadata.rootHelpText);
    if (commands.length >= 10) return { pattern: buildCommandHintPattern(commands), commands };
  } catch {
    // fall through to the static list
  }
  return { pattern: buildCommandHintPattern(FALLBACK_COMMANDS), commands: FALLBACK_COMMANDS };
}

function transform(text, scope, ruleStats, commandPattern, onChange) {
  let out = text;
  for (const rule of TARGETED_RULES) {
    if (rule.scope !== scope) continue;
    const stat = ruleStats[rule.id];
    rule.find.lastIndex = 0;
    const matches = out.match(rule.find);
    if (matches) {
      stat.replaced += matches.length;
      out = out.replace(rule.find, rule.replace);
    }
    if (rule.applied && rule.applied.test(out)) stat.present = true;
  }
  if (scope === "ui-html") return out; // only targeted rules: inline scripts are CSP-hashed
  const product = replaceProductName(out, { skipQuotedIdentifiers: scope === "cli" });
  ruleStats["product-name"].replaced += product.count;
  const hints = replaceCommandHints(product.text, commandPattern);
  ruleStats["command-hints"].replaced += hints.count;
  const regexes = widenRegexPrefixes(hints.text);
  ruleStats["regex-prefixes"].replaced += regexes.count;
  if (onChange && regexes.text !== text) onChange(text, regexes.text);
  return regexes.text;
}

function contextSamples(before, after) {
  // Cheap diff for reports: show the first differing windows.
  const samples = [];
  let i = 0;
  let j = 0;
  while (i < before.length && samples.length < 3) {
    if (before[i] === after[j]) {
      i++;
      j++;
      continue;
    }
    samples.push(before.slice(Math.max(0, i - 50), i + 60).replace(/\s+/g, " "));
    const next = before.indexOf(" ", i + 8);
    const skip = next === -1 ? before.length - i : next - i;
    const resync = after.indexOf(before.slice(i + skip, i + skip + 24), j);
    if (resync === -1) break;
    i += skip;
    j = resync;
  }
  return samples;
}

function brotli(buf) {
  return zlib.brotliCompressSync(buf, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 9,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length,
    },
  });
}

/**
 * Re-synchronises the dashboard's integrity metadata with the files on disk.
 * Self-healing and idempotent: anything whose hash no longer matches is refreshed.
 */
export function syncControlUiIntegrity(uiRoot, { dryRun = false } = {}) {
  const manifestPath = path.join(uiRoot, "asset-manifest.json");
  if (!existsSync(manifestPath)) return { changed: 0 };
  const rawManifest = readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(rawManifest);
  const changedBases = new Set();
  let changed = 0;

  for (const entry of manifest.assets) {
    if (/\.(?:br|gz)$/.test(entry.path)) continue;
    const file = path.join(uiRoot, entry.path);
    if (!existsSync(file)) continue;
    const buf = readFileSync(file);
    const digest = sha256Hex(buf);
    if (digest !== entry.sha256 || buf.length !== entry.size) {
      changedBases.add(entry.path);
      entry.sha256 = digest;
      entry.size = buf.length;
      changed++;
    }
  }
  for (const entry of manifest.assets) {
    const match = entry.path.match(/^(.*)\.(br|gz)$/);
    if (!match) continue;
    const file = path.join(uiRoot, entry.path);
    let buf = existsSync(file) ? readFileSync(file) : undefined;
    if (changedBases.has(match[1]) || !buf) {
      const base = readFileSync(path.join(uiRoot, match[1]));
      buf = match[2] === "br" ? brotli(base) : zlib.gzipSync(base, { level: 9 });
      if (!dryRun) writeFileSync(file, buf);
    }
    const digest = sha256Hex(buf);
    if (digest !== entry.sha256 || buf.length !== entry.size) {
      entry.sha256 = digest;
      entry.size = buf.length;
      changed++;
    }
  }

  const generation = createHash("sha256");
  for (const entry of manifest.assets) generation.update(`${entry.path}\0${entry.size}\0${entry.sha256}\n`);
  manifest.generation = generation.digest("hex");

  // Service worker offline boot graph: embedded index.html + per-asset integrity.
  const swPath = path.join(uiRoot, "sw.js");
  if (existsSync(swPath)) {
    const sw = readFileSync(swPath, "utf8");
    const bootMatch = sw.match(/^const OFFLINE_BOOT = (.*);$/m);
    if (bootMatch && bootMatch[1] !== "null") {
      const boot = JSON.parse(bootMatch[1]);
      const html = readFileSync(path.join(uiRoot, "index.html"), "utf8");
      let bootChanged = boot.html !== html;
      boot.html = html;
      for (const asset of boot.assets ?? []) {
        const file = path.join(uiRoot, asset.path);
        if (!existsSync(file)) continue;
        const integrity = `sha256-${sha256B64(readFileSync(file))}`;
        if (integrity !== asset.integrity) {
          asset.integrity = integrity;
          bootChanged = true;
        }
      }
      if (bootChanged) {
        boot.id = sha256Hex(`${manifest.generation}\n${html}`).slice(0, 16);
        const nextSw = sw.replace(bootMatch[0], () => `const OFFLINE_BOOT = ${JSON.stringify(boot)};`);
        if (!dryRun) writeFileSync(swPath, nextSw);
        changed++;
      }
    }
  }

  if (changed && !dryRun) {
    writeFileSync(manifestPath, `${JSON.stringify(manifest)}${rawManifest.endsWith("\n") ? "\n" : ""}`);
  }
  return { changed };
}

function brandIcons(uiRoot, dryRun) {
  let changed = 0;
  for (const icon of UI_ICON_FILES) {
    const target = path.join(uiRoot, icon.from);
    if (!existsSync(target)) continue;
    const source = readFileSync(path.join(ASSETS_DIR, icon.source));
    if (!readFileSync(target).equals(source)) {
      if (!dryRun) writeFileSync(target, source);
      changed++;
    }
  }
  const manifestPath = path.join(uiRoot, "manifest.webmanifest");
  if (existsSync(manifestPath)) {
    const raw = readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(raw);
    const next = { ...manifest, ...UI_MANIFEST_PATCH };
    const out = `${JSON.stringify(next, null, 2)}\n`;
    if (out !== raw) {
      if (!dryRun) writeFileSync(manifestPath, out);
      changed++;
    }
  }
  return changed;
}

export function rebrandEngine({ engineRoot, mode = "apply" } = {}) {
  const dryRun = mode !== "apply";
  const { dist, uiRoot, scopes } = collectTargets(engineRoot);
  // Resolve before any file changes so the pattern does not depend on run order.
  const { pattern: commandPattern, commands } = resolveCommandPattern(dist);

  const ruleStats = Object.fromEntries(
    [...TARGETED_RULES.map((r) => r.id), "product-name", "command-hints", "regex-prefixes"].map((id) => [
      id,
      { replaced: 0, present: false },
    ]),
  );
  const changedFiles = [];
  const report = [];

  for (const [scope, files] of Object.entries(scopes)) {
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      const next = transform(
        text,
        scope,
        ruleStats,
        commandPattern,
        mode === "report" ? (before, after) => report.push({ file, samples: contextSamples(before, after) }) : undefined,
      );
      if (next !== text) {
        changedFiles.push(path.relative(engineRoot, file));
        if (!dryRun) writeFileSync(file, next);
      }
    }
  }

  const iconChanges = brandIcons(uiRoot, dryRun);
  const integrity = dryRun ? { changed: 0 } : syncControlUiIntegrity(uiRoot);
  // Full rescan (not just changedFiles): icons, .br/.gz copies, sw.js and the
  // asset manifest change as side effects, and an interrupted earlier run is healed.
  const inventory = syncContentInventory(engineRoot, { dryRun });

  const missing = TARGETED_RULES.filter(
    (rule) => rule.required && ruleStats[rule.id].replaced === 0 && !ruleStats[rule.id].present,
  ).map((rule) => rule.id);

  return { ruleStats, changedFiles, iconChanges, integrity, inventory, missing, report, commands };
}

function parseArgs(argv) {
  const args = { mode: "apply", ifNeeded: false, quiet: false, engine: undefined };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (["apply", "check", "report"].includes(arg)) args.mode = arg;
    else if (arg === "--if-needed") args.ifNeeded = true;
    else if (arg === "--quiet") args.quiet = true;
    else if (arg === "--engine") args.engine = path.resolve(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const engineRoot = args.engine ?? resolveEngineRoot();
  if (!engineRoot || !existsSync(path.join(engineRoot, "dist"))) {
    console.error("AI RAMU rebrand: engine package not found. Run `npm install` first.");
    process.exit(1);
  }
  const info = readEngineInfo(engineRoot);
  const rulesHash = computeRulesHash();
  const say = args.quiet ? () => {} : (msg) => console.log(msg);

  if (args.mode === "apply" && args.ifNeeded) {
    const stamp = readBrandingStamp(engineRoot);
    if (stamp?.rulesHash === rulesHash && stamp?.engine?.version === info.version) {
      say(`AI RAMU branding already applied (engine ${info.version}).`);
      return;
    }
  }

  say(`AI RAMU rebrand: ${args.mode} on engine ${info.version} (${path.relative(process.cwd(), engineRoot) || "."})`);
  const started = Date.now();
  const result = rebrandEngine({ engineRoot, mode: args.mode });

  for (const [id, stat] of Object.entries(result.ruleStats)) {
    say(`  ${stat.replaced || stat.present ? "✓" : "·"} ${id.padEnd(22)} ${stat.replaced} replaced${stat.present ? " (present)" : ""}`);
  }
  say(`  subcommands recognised: ${result.commands.length}`);
  say(`  files ${args.mode === "apply" ? "changed" : "pending"}: ${result.changedFiles.length}, icons/manifest: ${result.iconChanges}, dashboard integrity updates: ${result.integrity.changed}, inventory ${args.mode === "apply" ? "updated" : "mismatched"}: ${result.inventory.changed}/${result.inventory.checked}`);
  if (args.mode === "report") {
    for (const entry of result.report) {
      console.log(`\n${path.relative(engineRoot, entry.file)}`);
      for (const sample of entry.samples) console.log(`    ${sample}`);
    }
  }

  if (result.missing.length) {
    console.error(`AI RAMU rebrand: required rules did not match: ${result.missing.join(", ")}`);
    console.error("The upstream engine changed shape. Update branding/rules.mjs before shipping.");
    process.exit(2);
  }

  if (args.mode === "check") {
    const pending = result.changedFiles.length + result.iconChanges;
    const stamp = readBrandingStamp(engineRoot);
    const integrity = syncControlUiIntegrity(path.join(engineRoot, "dist", "control-ui"), { dryRun: true });
    if (pending || integrity.changed || result.inventory.changed || stamp?.rulesHash !== rulesHash) {
      console.error(`AI RAMU rebrand check failed: ${pending} pending changes, ${integrity.changed} dashboard integrity mismatches, ${result.inventory.changed} inventory mismatches, stamp ${stamp ? stamp.rulesHash : "missing"} vs ${rulesHash}.`);
      process.exit(1);
    }
    say("AI RAMU branding check passed.");
    return;
  }

  if (args.mode === "apply") {
    // Counts accumulate across re-runs on the same engine so a no-op re-run keeps
    // the record of what the first run changed.
    const previous = readBrandingStamp(engineRoot);
    const carry = previous?.engine?.version === info.version ? previous : undefined;
    const stamp = {
      product: "AI RAMU",
      engine: { name: "openclaw", version: info.version, commit: info.commit },
      rulesHash,
      appliedAt: new Date().toISOString(),
      changedFiles: (carry?.changedFiles ?? 0) + result.changedFiles.length,
      replacements: Object.fromEntries(
        Object.entries(result.ruleStats).map(([id, s]) => [id, (carry?.replacements?.[id] ?? 0) + s.replaced]),
      ),
    };
    writeFileSync(path.join(engineRoot, STAMP_FILENAME), `${JSON.stringify(stamp, null, 2)}\n`);
    say(`AI RAMU branding applied in ${((Date.now() - started) / 1000).toFixed(1)}s.`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(`AI RAMU rebrand failed: ${error.stack ?? error}`);
    process.exit(1);
  });
}

