#!/usr/bin/env node
import { spawn } from "node:child_process";
import readline from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ramuPath = path.join(__dirname, "ramu.mjs");

function runCommand(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [ramuPath, ...args], {
      stdio: "inherit",
      cwd: __dirname,
      env: process.env,
    });
    child.on("close", (code) => resolve(code ?? 0));
  });
}

const banner = `
======================================================================
  \x1b[38;2;255;153;51m🇮🇳  AI RAMU — Bolo Ramu, Kaam Shuru.  🇮🇳\x1b[0m
  \x1b[36mYour Indian AI Worker | Desktop, WhatsApp & Web Dashboard\x1b[0m
======================================================================
`;

async function main() {
  console.clear?.();
  console.log(banner);

  const arg = process.argv[2];
  if (arg === "--all" || arg === "-a" || arg === "all") {
    await launchAll();
    return;
  }
  if (arg === "onboard" || arg === "wizard") {
    await runCommand(["onboard"]);
    return;
  }
  if (arg === "whatsapp" || arg === "qr") {
    await runCommand(["channels", "login", "--channel", "whatsapp"]);
    return;
  }
  if (arg === "dashboard" || arg === "ui") {
    await runCommand(["dashboard", "--yes"]);
    return;
  }
  if (arg === "chat") {
    await runCommand(["chat"]);
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\x1b[1mWhat would you like to do?\x1b[0m\n");
  console.log("  \x1b[32m[1]\x1b[0m 🚀 \x1b[1mQuick Launch All\x1b[0m (Setup workspace + Launch Gateway + Web Dashboard)");
  console.log("  \x1b[33m[2]\x1b[0m 🧙 \x1b[1mInteractive Onboarding Wizard\x1b[0m (Configure AI models & keys)");
  console.log("  \x1b[32m[3]\x1b[0m 📱 \x1b[1mLink WhatsApp\x1b[0m (Show Terminal QR Code Scanner)");
  console.log("  \x1b[34m[4]\x1b[0m 🌐 \x1b[1mOpen Web Dashboard\x1b[0m");
  console.log("  \x1b[35m[5]\x1b[0m 💬 \x1b[1mTerminal Chat with Ramu\x1b[0m");
  console.log("  \x1b[36m[6]\x1b[0m 🩺 \x1b[1mDoctor / Diagnostics\x1b[0m");
  console.log("  \x1b[90m[Q]\x1b[0m ❌ Exit\n");

  rl.question("👉 Select an option \x1b[90m[1-6, default: 1]\x1b[0m: ", async (answer) => {
    rl.close();
    const choice = (answer || "1").trim().toLowerCase();

    switch (choice) {
      case "1":
      case "":
        await launchAll();
        break;
      case "2":
        console.log("\n\x1b[33mStarting Interactive Onboarding Wizard...\x1b[0m\n");
        await runCommand(["onboard"]);
        break;
      case "3":
        console.log("\n\x1b[32mConnecting to WhatsApp & generating QR code...\x1b[0m\n");
        await runCommand(["channels", "login", "--channel", "whatsapp"]);
        break;
      case "4":
        console.log("\n\x1b[34mOpening Web Dashboard...\x1b[0m\n");
        await runCommand(["dashboard", "--yes"]);
        break;
      case "5":
        console.log("\n\x1b[35mLaunching Terminal Chat...\x1b[0m\n");
        await runCommand(["chat"]);
        break;
      case "6":
        console.log("\n\x1b[36mRunning Ramu Doctor Health Check...\x1b[0m\n");
        await runCommand(["doctor", "--fix"]);
        break;
      case "q":
        console.log("\nNamaste! Dhanyawad.\n");
        process.exit(0);
        break;
      default:
        console.log(`\nUnknown choice: ${choice}. Launching quickstart...\n`);
        await launchAll();
        break;
    }
  });
}

async function launchAll() {
  console.log("\n\x1b[32m[1/2] Ensuring workspace & baseline config are ready...\x1b[0m");
  await runCommand(["setup", "--baseline"]);

  console.log("\n\x1b[32m[2/2] Starting Gateway & Opening AI Ramu Control Dashboard...\x1b[0m\n");
  await runCommand(["dashboard", "--yes"]);
}

main().catch(console.error);
