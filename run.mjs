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

async function isGatewayHealthy() {
  try {
    const res = await fetch("http://127.0.0.1:18789/", { signal: AbortSignal.timeout(1500) });
    return res.status === 200;
  } catch {
    return false;
  }
}

const banner = `
======================================================================
  \x1b[38;2;255;153;51m🇮🇳  AI RAMU — Bolo Ramu, Kaam Shuru.  🇮🇳\x1b[0m
  \x1b[36mYour Indian AI Worker | Desktop, WhatsApp & Web Dashboard\x1b[0m
======================================================================
`;

export async function launchAll() {
  console.log(banner);
  console.log("\x1b[33m🚀 Starting AI RAMU Complete Stack...\x1b[0m\n");

  console.log("\x1b[32m[1/3] Ensuring workspace and configuration are ready...\x1b[0m");
  await runCommand(["setup", "--baseline"]);

  console.log("\n\x1b[32m[2/3] Checking AI RAMU Gateway service...\x1b[0m");
  const alreadyRunning = await isGatewayHealthy();
  if (alreadyRunning) {
    console.log("       Gateway is already active on http://127.0.0.1:18789");
  } else {
    console.log("       Starting Gateway service in background...");
    if (process.platform === "win32") {
      spawn("powershell.exe", [
        "-Command",
        `Start-Process "${process.execPath}" -ArgumentList '"${ramuPath}"', 'gateway', 'run' -WindowStyle Hidden`
      ], {
        detached: true,
        stdio: "ignore"
      }).unref();
    } else {
      const gw = spawn(process.execPath, [ramuPath, "gateway", "run"], {
        detached: true,
        stdio: "ignore",
        cwd: __dirname,
        env: process.env,
      });
      gw.unref();
    }

    process.stdout.write("       Waiting for Gateway to be ready");
    for (let i = 0; i < 35; i++) {
      process.stdout.write(".");
      await new Promise((r) => setTimeout(r, 1000));
      if (await isGatewayHealthy()) {
        console.log(" Ready!");
        break;
      }
    }
  }

  console.log("\n\x1b[34m[3/3] Opening Web Dashboard in your browser...\x1b[0m");
  await runCommand(["dashboard", "--yes"]);

  console.log("\n\x1b[32m======================================================================\x1b[0m");
  console.log("\x1b[1m📱 WhatsApp Connection (Scan the QR Code Below with Your Phone):\x1b[0m");
  console.log("\x1b[90mOpen WhatsApp > Settings > Linked Devices > Link a Device\x1b[0m");
  console.log("\x1b[32m======================================================================\x1b[0m\n");

  await runCommand(["channels", "login", "--channel", "whatsapp"]);
}

async function main() {
  const arg = process.argv[2];

  // If invoked with no args or --all / all / start / run-all, run all directly!
  if (!arg || arg === "--all" || arg === "-a" || arg === "all" || arg === "run-all" || arg === "start") {
    await launchAll();
    return;
  }

  console.clear?.();
  console.log(banner);

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

  // Interactive menu fallback if needed
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\x1b[1mCommands:\x1b[0m\n");
  console.log("  [1] 🚀 Run All (Workspace + Gateway + Dashboard + WhatsApp)");
  console.log("  [2] 🧙 Interactive Onboarding Wizard");
  console.log("  [3] 📱 Link WhatsApp (Terminal QR Code Scanner)");
  console.log("  [4] 🌐 Open Web Dashboard");
  console.log("  [5] 💬 Terminal Chat with Ramu");
  console.log("  [6] 🩺 Doctor Health Check");
  console.log("  [Q] Exit\n");

  rl.question("Select an option [1-6, default: 1]: ", async (answer) => {
    rl.close();
    const choice = (answer || "1").trim().toLowerCase();
    switch (choice) {
      case "1":
      case "":
        await launchAll();
        break;
      case "2":
        await runCommand(["onboard"]);
        break;
      case "3":
        await runCommand(["channels", "login", "--channel", "whatsapp"]);
        break;
      case "4":
        await runCommand(["dashboard", "--yes"]);
        break;
      case "5":
        await runCommand(["chat"]);
        break;
      case "6":
        await runCommand(["doctor", "--fix"]);
        break;
      default:
        await launchAll();
        break;
    }
  });
}

main().catch(console.error);
