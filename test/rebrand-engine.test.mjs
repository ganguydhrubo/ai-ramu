import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import zlib from "node:zlib";
import { rebrandEngine, syncContentInventory } from "../scripts/rebrand-engine.mjs";

const sha = (buf) => createHash("sha256").update(buf).digest("hex");

// A miniature engine with the same shapes the real one ships.
function makeEngine() {
  const root = mkdtempSync(path.join(os.tmpdir(), "ramu-engine-"));
  const dist = path.join(root, "dist");
  const ui = path.join(dist, "control-ui");
  mkdirSync(path.join(ui, "assets"), { recursive: true });
  mkdirSync(path.join(dist, "extensions", "browser"), { recursive: true });
  const files = {
    "openclaw.mjs": "process.stdout.write(commit ? `OpenClaw ${version} (${commit})\\n` : `OpenClaw ${version}\\n`);\n",
    "dist/cli-name-X.mjs": 'const CLI_NAME = "openclaw";\n',
    "dist/banner-X.mjs": [
      "function pickCliLobsterArt(now, env = process.env) {",
      "\tif (env.CI || env.VITEST) return null;",
      "\tif (!isLobsterDay(now)) return null;",
      "}",
      'const DEFAULT_TAGLINE = "All your chats, one OpenClaw.";',
      "function pickTagline(options = {}) {",
      '\tif (options.mode === "off") return "";',
      '\tif (options.mode === "default") return DEFAULT_TAGLINE;',
      "}",
      'const title = decorativePrefix("🦞", "OpenClaw", options);',
      'const prefix = decorativeEmoji("🦞", options);',
      "",
    ].join("\n"),
    "dist/version-X.mjs": "console.log(`OpenClaw ${VERSION}`); const TASK = \"OpenClaw Gateway\";\n",
    "dist/hints-X.mjs": 'const hint = "Run openclaw doctor --fix"; const re = /^openclaw gateway \\(.+\\)$/;\n',
    "dist/cli-startup-metadata.json": JSON.stringify({ rootHelpText: "Commands:\n  doctor   Fix\n  gateway *  Run\n\nX" }),
    "dist/extensions/browser/openclaw.plugin.json": JSON.stringify({ id: "browser", description: "Manage OpenClaw's browser" }),
    "dist/control-ui/index.html": '<title>OpenClaw Control</title>\n<meta name="theme-color" media="(prefers-color-scheme: light)" content="#faf9f7" />\n<script type="module" src="./assets/index-A.js"></script>\n',
    "dist/control-ui/assets/index-A.js": "export const t={thinking:`OpenClaw is thinking`,key:`openclaw.control.settings.v1`};\n",
    "dist/control-ui/favicon.svg": "<svg>lobster</svg>",
    "dist/control-ui/manifest.webmanifest": JSON.stringify({ name: "OpenClaw Control", short_name: "OpenClaw" }, null, 2),
  };
  for (const [rel, content] of Object.entries(files)) writeFileSync(path.join(root, rel), content);
  const js = readFileSync(path.join(ui, "assets", "index-A.js"));
  writeFileSync(path.join(ui, "assets", "index-A.js.br"), zlib.brotliCompressSync(js));
  writeFileSync(path.join(ui, "assets", "index-A.js.gz"), zlib.gzipSync(js));
  const manifestEntries = ["assets/index-A.js", "assets/index-A.js.br", "assets/index-A.js.gz", "favicon.svg"].map((p) => {
    const buf = readFileSync(path.join(ui, p));
    return { path: p, sha256: sha(buf), size: buf.length };
  });
  writeFileSync(path.join(ui, "asset-manifest.json"), JSON.stringify({ version: 1, generation: "x", assets: manifestEntries }));
  const html = readFileSync(path.join(ui, "index.html"), "utf8");
  const boot = { html, assets: [{ path: "assets/index-A.js", integrity: "sha256-old" }], id: "0000000000000000" };
  writeFileSync(path.join(ui, "sw.js"), `const A = 1;\nconst OFFLINE_BOOT = ${JSON.stringify(boot)};\nconst B = 2;\n`);
  const inventory = Object.keys(files)
    .filter((p) => p.startsWith("dist/"))
    .map((p) => ({ path: p, sha256: "0".repeat(64), mode: 420, size: 0 }));
  writeFileSync(path.join(dist, "postinstall-content-inventory.json"), JSON.stringify(inventory, null, 2));
  return root;
}

test("rebrand applies, rebuilds integrity metadata and is idempotent", () => {
  const root = makeEngine();
  try {
    const first = rebrandEngine({ engineRoot: root, mode: "apply" });
    assert.deepEqual(first.missing, []);
    const read = (rel) => readFileSync(path.join(root, rel), "utf8");

    assert.match(read("dist/cli-name-X.mjs"), /CLI_NAME = "ramu"/);
    assert.match(read("openclaw.mjs"), /`AI RAMU \$\{version\}/);
    assert.match(read("dist/banner-X.mjs"), /DEFAULT_TAGLINE = "Bolo Ramu, Kaam Shuru\."/);
    assert.match(read("dist/banner-X.mjs"), /return DEFAULT_TAGLINE;\n\tif \(options.mode === "default"\)/);
    assert.doesNotMatch(read("dist/banner-X.mjs"), /🦞|isLobsterDay/);
    assert.match(read("dist/version-X.mjs"), /`AI RAMU \$\{VERSION\}`.*"OpenClaw Gateway"/);
    assert.match(read("dist/hints-X.mjs"), /Run ramu doctor --fix.*\^\(\?:openclaw\|ramu\) gateway/);
    assert.match(read("dist/extensions/browser/openclaw.plugin.json"), /Manage AI RAMU's browser/);
    assert.match(read("dist/control-ui/index.html"), /<title>AI RAMU<\/title>/);
    assert.match(read("dist/control-ui/assets/index-A.js"), /AI RAMU is thinking.*openclaw\.control\.settings\.v1/);
    assert.equal(JSON.parse(read("dist/control-ui/manifest.webmanifest")).name, "AI RAMU");
    assert.doesNotMatch(read("dist/control-ui/favicon.svg"), /lobster/);

    // Precompressed copies match the rebranded source.
    const js = readFileSync(path.join(root, "dist/control-ui/assets/index-A.js"));
    assert.ok(zlib.brotliDecompressSync(readFileSync(path.join(root, "dist/control-ui/assets/index-A.js.br"))).equals(js));
    assert.ok(zlib.gunzipSync(readFileSync(path.join(root, "dist/control-ui/assets/index-A.js.gz"))).equals(js));

    // Asset manifest hashes, generation and service-worker boot graph are consistent.
    const manifest = JSON.parse(read("dist/control-ui/asset-manifest.json"));
    for (const entry of manifest.assets) {
      assert.equal(entry.sha256, sha(readFileSync(path.join(root, "dist/control-ui", entry.path))), entry.path);
    }
    const gen = createHash("sha256");
    for (const e of manifest.assets) gen.update(`${e.path}\0${e.size}\0${e.sha256}\n`);
    assert.equal(manifest.generation, gen.digest("hex"));
    const boot = JSON.parse(read("dist/control-ui/sw.js").match(/^const OFFLINE_BOOT = (.*);$/m)[1]);
    assert.equal(boot.html, read("dist/control-ui/index.html"));
    assert.equal(boot.assets[0].integrity, `sha256-${createHash("sha256").update(js).digest("base64")}`);
    assert.notEqual(boot.id, "0000000000000000");

    // Package content inventory matches disk.
    assert.equal(syncContentInventory(root, { dryRun: true }).changed, 0);

    // Second run changes nothing.
    const second = rebrandEngine({ engineRoot: root, mode: "apply" });
    assert.deepEqual(second.changedFiles, []);
    assert.equal(second.iconChanges, 0);
    assert.equal(second.integrity.changed, 0);
    assert.equal(second.inventory.changed, 0);
    assert.deepEqual(second.missing, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("missing upstream targets are reported, not silently skipped", () => {
  const root = makeEngine();
  try {
    writeFileSync(path.join(root, "dist/cli-name-X.mjs"), 'export const CLI_BINARY = "openclaw";\n');
    const result = rebrandEngine({ engineRoot: root, mode: "check" });
    assert.ok(result.missing.includes("cli-name"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
