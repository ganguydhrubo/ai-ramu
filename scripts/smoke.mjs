#!/usr/bin/env node
// End-to-end smoke test in a throwaway state dir: baseline setup, gateway start,
// readiness, live dashboard branding checks, clean shutdown. Never touches the
// user's real ~/.openclaw (config, WhatsApp session, workspaces).
//
//   node scripts/smoke.mjs [--port 19789] [--timeout 420]
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, openSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gatewayState } from "../lib/launcher.mjs";

const RAMU_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BIN = path.join(RAMU_ROOT, "bin", "ramu.mjs");
const argv = process.argv.slice(2);
const port = Number(argv.includes("--port") ? argv[argv.indexOf("--port") + 1] : 19789);
const timeout = Number(argv.includes("--timeout") ? argv[argv.indexOf("--timeout") + 1] : 420);

const stateDir = mkdtempSync(path.join(os.tmpdir(), "ramu-smoke-"));
const env = {
  ...process.env,
  OPENCLAW_STATE_DIR: stateDir,
  OPENCLAW_CONFIG_PATH: path.join(stateDir, "openclaw.json"),
  OPENCLAW_GATEWAY_PORT: String(port),
  NO_COLOR: "1",
};
const step = (msg) => console.log(`\n▶ ${msg}`);

function killTree(pid) {
  if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
  else {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      // already gone
    }
  }
}

let gateway;
let code = 1;
try {
  if ((await gatewayState(port)) !== "stopped") throw new Error(`port ${port} is already in use`);

  step("ramu setup --baseline (isolated state dir)");
  const setup = spawnSync(process.execPath, [BIN, "setup", "--baseline"], { env, stdio: "inherit", timeout: 600_000 });
  if (setup.status !== 0) throw new Error(`setup exited ${setup.status}`);

  step(`ramu gateway run --port ${port}`);
  const logFile = path.join(stateDir, "gateway.log");
  const out = openSync(logFile, "a");
  gateway = spawn(process.execPath, [BIN, "gateway", "run", "--port", String(port)], {
    env,
    stdio: ["ignore", out, out],
    detached: process.platform !== "win32",
    windowsHide: true,
  });
  const started = Date.now();
  let ready = false;
  while ((Date.now() - started) / 1000 < timeout) {
    if ((await gatewayState(port)) === "ready") {
      ready = true;
      break;
    }
    if (gateway.exitCode !== null) break;
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (!ready) {
    console.log(readFileSync(logFile, "utf8").split("\n").slice(-40).join("\n"));
    throw new Error(`gateway not ready after ${Math.round((Date.now() - started) / 1000)}s`);
  }
  console.log(`  ready after ${Math.round((Date.now() - started) / 1000)}s`);

  step("live branding verification (CLI + dashboard)");
  const verify = spawnSync(
    process.execPath,
    [path.join(RAMU_ROOT, "scripts", "verify-branding.mjs"), "--gateway", `http://127.0.0.1:${port}/`, ...argv.filter((a) => a === "--all-commands")],
    { env, stdio: "inherit", timeout: 1_800_000 },
  );
  if (verify.status !== 0) throw new Error("branding verification failed");
  code = 0;
  console.log("\n✓ Smoke test passed");
} catch (error) {
  console.error(`\n✗ Smoke test failed: ${error.message}`);
} finally {
  if (gateway?.pid) killTree(gateway.pid);
  await new Promise((r) => setTimeout(r, 1500));
  rmSync(stateDir, { recursive: true, force: true, maxRetries: 5 });
}
process.exit(code);
