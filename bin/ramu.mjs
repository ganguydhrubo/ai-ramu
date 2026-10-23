#!/usr/bin/env node
// AI RAMU command-line entry point.
//
//   ramu                 start everything (gateway + dashboard) — same as `ramu start`
//   ramu whatsapp        install the WhatsApp channel if needed and show the pairing QR
//   ramu about           AI RAMU, engine and branding status
//   ramu <command> …     any engine command (onboard, channels, doctor, gateway, …)
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readBrandingStamp, readEngineInfo, RAMU_ROOT } from "../lib/engine.mjs";

const args = process.argv.slice(2);
const LAUNCHER_ALIASES = new Set(["start", "--all", "-a", "all", "run-all"]);

function ensureBranding() {
  // Cheap when already applied: compares the stamp with the rules hash.
  const result = spawnSync(
    process.execPath,
    [path.join(RAMU_ROOT, "scripts", "rebrand-engine.mjs"), "apply", "--if-needed", "--quiet"],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    console.error("AI RAMU: could not apply branding to the engine. Try `npm install` in the AI RAMU folder.");
    process.exit(result.status ?? 1);
  }
}

async function runEngine(engineArgs) {
  const info = readEngineInfo();
  if (!info) {
    console.error("AI RAMU: engine not installed. Run `npm install` in the AI RAMU folder first.");
    process.exit(1);
  }
  const stamp = readBrandingStamp(info.root);
  const { computeRulesHash } = await import("../scripts/rebrand-engine.mjs");
  if (stamp?.engine?.version !== info.version || stamp?.rulesHash !== computeRulesHash()) ensureBranding();
  // The engine's launcher identifies itself through argv[1].
  process.argv = [process.argv[0], info.entry, ...engineArgs];
  await import(pathToFileURL(info.entry).href);
}

if (args.length === 0 || (args.length === 1 && LAUNCHER_ALIASES.has(args[0]))) {
  const { launch } = await import("../lib/launcher.mjs");
  process.exitCode = await launch();
} else if (args[0] === "whatsapp" || args[0] === "qr") {
  const { pairWhatsApp } = await import("../lib/launcher.mjs");
  process.exitCode = await pairWhatsApp();
} else if (args[0] === "about") {
  const { about } = await import("../lib/launcher.mjs");
  process.exitCode = about();
} else {
  await runEngine(args);
}
