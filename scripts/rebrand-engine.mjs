#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

console.log("🇮🇳 Running AI RAMU Rebrand & Sanitization Engine...");

// 1. Patch package.json
const pkgPath = path.join(rootDir, "package.json");
if (existsSync(pkgPath)) {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.name = "ai-ramu";
  pkg.description = "AI RAMU — Bolo Ramu, Kaam Shuru. Personal AI Worker, Desktop Agent and Automation Platform.";
  pkg.bin = {
    "ai-ramu": "openclaw.mjs",
    "ramu": "openclaw.mjs",
    "openclaw": "openclaw.mjs"
  };
  pkg.scripts = pkg.scripts || {};
  pkg.scripts["start"] = "node run.mjs --all";
  pkg.scripts["all"] = "node run.mjs --all";
  pkg.scripts["run-all"] = "node run.mjs --all";
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("✓ package.json rebranded to AI RAMU");
}

// 2. Patch ENTRY_WRAPPER_PAIRS in src/entry.ts
const srcEntryPath = path.join(rootDir, "src", "entry.ts");
if (existsSync(srcEntryPath)) {
  let content = readFileSync(srcEntryPath, "utf8");
  if (!content.includes('wrapperBasename: "ramu.mjs"')) {
    content = content.replace(
      /const ENTRY_WRAPPER_PAIRS = \[\s*\{ wrapperBasename: "openclaw\.mjs"[^\]]+\]/s,
      `const ENTRY_WRAPPER_PAIRS = [
  { wrapperBasename: "openclaw.mjs", entryBasename: "entry.js" },
  { wrapperBasename: "openclaw.mjs", entryBasename: "entry.mjs" },
  { wrapperBasename: "openclaw.js", entryBasename: "entry.js" },
  { wrapperBasename: "ramu.mjs", entryBasename: "entry.js" },
  { wrapperBasename: "ramu.mjs", entryBasename: "entry.mjs" },
  { wrapperBasename: "ramu.js", entryBasename: "entry.js" },
  { wrapperBasename: "ai-ramu.mjs", entryBasename: "entry.js" },
  { wrapperBasename: "ai-ramu.mjs", entryBasename: "entry.mjs" },
  { wrapperBasename: "ai-ramu.js", entryBasename: "entry.js" },
]`
    );
    writeFileSync(srcEntryPath, content);
    console.log("✓ src/entry.ts patched with ramu wrapper pairs");
  }
}

// 3. Patch ENTRY_WRAPPER_PAIRS in dist/entry.js (if dist exists)
const distEntryPath = path.join(rootDir, "dist", "entry.js");
if (existsSync(distEntryPath)) {
  let content = readFileSync(distEntryPath, "utf8");
  if (!content.includes('wrapperBasename: "ramu.mjs"')) {
    content = content.replace(
      /const ENTRY_WRAPPER_PAIRS = \[\s*\{\s*wrapperBasename: "openclaw\.mjs"[^\]]+\];/s,
      `const ENTRY_WRAPPER_PAIRS = [
\t{
\t\twrapperBasename: "openclaw.mjs",
\t\tentryBasename: "entry.js"
\t},
\t{
\t\twrapperBasename: "openclaw.mjs",
\t\tentryBasename: "entry.mjs"
\t},
\t{
\t\twrapperBasename: "openclaw.js",
\t\tentryBasename: "entry.js"
\t},
\t{
\t\twrapperBasename: "ramu.mjs",
\t\tentryBasename: "entry.js"
\t},
\t{
\t\twrapperBasename: "ramu.mjs",
\t\tentryBasename: "entry.mjs"
\t},
\t{
\t\twrapperBasename: "ramu.js",
\t\tentryBasename: "entry.js"
\t},
\t{
\t\twrapperBasename: "ai-ramu.mjs",
\t\tentryBasename: "entry.js"
\t},
\t{
\t\twrapperBasename: "ai-ramu.mjs",
\t\tentryBasename: "entry.mjs"
\t},
\t{
\t\twrapperBasename: "ai-ramu.js",
\t\tentryBasename: "entry.js"
\t}
];`
    );
    writeFileSync(distEntryPath, content);
    console.log("✓ dist/entry.js patched with ramu wrapper pairs");
  }
}

// 4. Patch dist banner
const bannerDistFiles = ["dist/banner-BTx3_y44.mjs"];
for (const file of bannerDistFiles) {
  const p = path.join(rootDir, file);
  if (existsSync(p)) {
    let c = readFileSync(p, "utf8");
    c = c.replace(/const DEFAULT_TAGLINE = ".*";/, 'const DEFAULT_TAGLINE = "Bolo Ramu, Kaam Shuru. — Your Indian AI Worker.";');
    c = c.replace(/decorativePrefix\("[^"]*",\s*"OpenClaw"/g, 'decorativePrefix("🇮🇳", "AI RAMU"');
    c = c.replace(/decorativeEmoji\("[^"]*"/g, 'decorativeEmoji("🇮🇳"');
    writeFileSync(p, c);
    console.log(`✓ ${file} banner updated to AI RAMU`);
  }
}

console.log("🇮🇳 Rebranding & sanitization complete!");
