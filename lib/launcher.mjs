// `ramu` / `ramu start`: one command that prepares config, starts the gateway in
// the background (once), waits until it is ready and opens the dashboard.
import { spawn, spawnSync } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { BRAND } from "../branding/brand.mjs";
import { RAMU_ROOT, readBrandingStamp, readEngineInfo, readJson } from "./engine.mjs";

const RAMU_BIN = path.join(RAMU_ROOT, "bin", "ramu.mjs");
const DEFAULT_PORT = 18789;
const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (text) => (tty ? `\x1b[${code}m${text}\x1b[0m` : String(text));
const c = {
  brand: (t) => (tty ? `\x1b[1;38;2;255;138;0m${t}\x1b[0m` : t),
  bold: paint("1"),
  dim: paint("2"),
  green: paint("32"),
  yellow: paint("33"),
  red: paint("31"),
  cyan: paint("36"),
};

export function resolveStateDir(env = process.env) {
  return env.OPENCLAW_STATE_DIR || path.join(os.homedir(), ".openclaw");
}

export function resolveConfigPath(env = process.env) {
  return env.OPENCLAW_CONFIG_PATH || path.join(resolveStateDir(env), "openclaw.json");
}

/** Gateway port: env override, then gateway.port from the config, then the default. */
export function resolveGatewayPort(env = process.env, configPath = resolveConfigPath(env)) {
  const fromEnv = Number.parseInt(env.OPENCLAW_GATEWAY_PORT ?? "", 10);
  if (Number.isInteger(fromEnv) && fromEnv > 0 && fromEnv < 65536) return fromEnv;
  try {
    const raw = readFileSync(configPath, "utf8");
    let port;
    try {
      port = JSON.parse(raw)?.gateway?.port;
    } catch {
      // JSON5 config: fall back to a scoped regex on the gateway block.
      const block = raw.match(/["']?gateway["']?\s*:\s*\{([\s\S]*?)\}/);
      port = block ? Number.parseInt(block[1].match(/["']?port["']?\s*:\s*(\d{2,5})/)?.[1] ?? "", 10) : undefined;
    }
    if (Number.isInteger(port) && port > 0 && port < 65536) return port;
  } catch {
    // no config yet
  }
  return DEFAULT_PORT;
}

/** Minimal semver range check for ranges like ">=24.22.1 <25 || >=26.12.1". */
export function satisfiesNodeRange(version, range) {
  if (!range) return true;
  const parse = (v) => v.replace(/^v/, "").split(".").map((n) => Number.parseInt(n, 10) || 0);
  const cmp = (a, b) => {
    for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) - (b[i] ?? 0);
    return 0;
  };
  const current = parse(version);
  return range.split("||").some((part) =>
    part
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .every((comparator) => {
        const m = comparator.match(/^(>=|<=|>|<|=)?(.+)$/);
        const d = cmp(current, parse(m[2]));
        switch (m[1]) {
          case ">=":
            return d >= 0;
          case "<=":
            return d <= 0;
          case ">":
            return d > 0;
          case "<":
            return d < 0;
          default:
            return d === 0;
        }
      }),
  );
}

async function fetchStatus(url, timeoutMs = 2000) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return res.status;
  } catch {
    return 0;
  }
}

export async function gatewayState(port) {
  if ((await fetchStatus(`http://127.0.0.1:${port}/readyz`)) === 200) return "ready";
  if ((await fetchStatus(`http://127.0.0.1:${port}/healthz`)) === 200) return "starting";
  const open = await new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port });
    socket.setTimeout(1000);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
  return open ? "occupied" : "stopped";
}

function runRamu(args, { capture = false } = {}) {
  const result = spawnSync(process.execPath, [RAMU_BIN, ...args], {
    cwd: RAMU_ROOT,
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
    env: process.env,
  });
  return { status: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function openInBrowser(url) {
  if (process.env.RAMU_NO_BROWSER === "1") return false;
  const [cmd, args] =
    process.platform === "win32"
      ? ["rundll32", ["url.dll,FileProtocolHandler", url]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];
  try {
    spawn(cmd, args, { stdio: "ignore", detached: true, windowsHide: true }).unref();
    return true;
  } catch {
    return false;
  }
}

function banner() {
  const line = "─".repeat(64);
  console.log(`\n${c.dim(line)}`);
  console.log(`  ${c.brand(`${BRAND.mark} ${BRAND.product}`)}  ${c.bold(BRAND.tagline)}`);
  console.log(`  ${c.dim(BRAND.description)}`);
  console.log(`${c.dim(line)}\n`);
}

function checkNode(info) {
  const range = info?.engines?.node;
  if (satisfiesNodeRange(process.versions.node, range)) return true;
  console.error(c.red(`✗ Node.js ${process.versions.node} is too old for this engine (needs ${range}).`));
  console.error("  Install the current Node.js 24 LTS from https://nodejs.org/ (or on Windows:");
  console.error("  winget install OpenJS.NodeJS.LTS), then run AI RAMU again.");
  return false;
}

function readSyncStatus() {
  return readJson(path.join(RAMU_ROOT, "upstream", "status.json"));
}

async function waitForGateway(port, child, logFile, timeoutSeconds) {
  const started = Date.now();
  let exited;
  child?.once("exit", (code) => {
    exited = code ?? 0;
  });
  process.stdout.write("  Waiting for the gateway");
  while ((Date.now() - started) / 1000 < timeoutSeconds) {
    const state = await gatewayState(port);
    if (state === "ready") {
      console.log(c.green(` ready (${Math.round((Date.now() - started) / 1000)}s)`));
      return true;
    }
    if (exited !== undefined) {
      console.log(c.red(` stopped (exit ${exited})`));
      printLogTail(logFile);
      return false;
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log(c.yellow(` still not ready after ${timeoutSeconds}s`));
  console.log(`  It may still be starting. Check ${logFile} or run ${c.cyan("ramu gateway status")}.`);
  return false;
}

function printLogTail(logFile, lines = 20) {
  try {
    const tail = readFileSync(logFile, "utf8").trimEnd().split("\n").slice(-lines);
    console.log(c.dim(`  Last ${tail.length} log lines (${logFile}):`));
    for (const l of tail) console.log(c.dim(`    ${l.replace(/\x1b\[[0-9;]*m/g, "")}`));
  } catch {
    // no log
  }
}

export async function launch() {
  banner();
  const info = readEngineInfo();
  if (!info) {
    console.error(c.red("✗ Engine not installed. Run `npm install` in the AI RAMU folder first."));
    return 1;
  }
  if (!checkNode(info)) return 1;

  console.log(c.bold("[1/4] Branding"));
  const brand = spawnSync(process.execPath, [path.join(RAMU_ROOT, "scripts", "rebrand-engine.mjs"), "apply", "--if-needed", "--quiet"], {
    stdio: "inherit",
  });
  if (brand.status !== 0) return brand.status ?? 1;
  const stamp = readBrandingStamp(info.root);
  console.log(`  ✓ ${BRAND.product} on engine ${info.version}${stamp ? "" : c.yellow(" (branding stamp missing)")}`);

  console.log(c.bold("\n[2/4] Configuration"));
  const configPath = resolveConfigPath();
  if (existsSync(configPath)) {
    console.log(`  ✓ Config found: ${configPath}`);
  } else {
    console.log("  Creating config, workspace and session folders…");
    const setup = runRamu(["setup", "--baseline"]);
    if (setup.status !== 0) {
      console.error(c.red("✗ Setup failed. Run `ramu doctor` for details."));
      return setup.status;
    }
  }

  console.log(c.bold("\n[3/4] Gateway"));
  const port = resolveGatewayPort();
  const stateDir = resolveStateDir();
  const logDir = path.join(stateDir, "logs");
  mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, "ai-ramu-gateway.log");
  const timeoutSeconds = Number.parseInt(process.env.RAMU_GATEWAY_TIMEOUT_SECONDS ?? "", 10) || 240;
  const state = await gatewayState(port);
  let ready = state === "ready";
  if (ready) {
    console.log(`  ✓ Already running on http://127.0.0.1:${port}/ (no second copy started)`);
  } else if (state === "starting" || state === "occupied") {
    console.log(`  Port ${port} is in use; waiting for the existing gateway instead of starting another…`);
    ready = await waitForGateway(port, undefined, logFile, timeoutSeconds);
    if (!ready && state === "occupied") {
      console.log(`  Something else may be using port ${port}. Set gateway.port with ${c.cyan("ramu configure")}.`);
    }
  } else {
    const out = openSync(logFile, "a");
    writeFileSync(path.join(stateDir, "ai-ramu-gateway.started"), `${new Date().toISOString()}\n`);
    const child = spawn(process.execPath, [RAMU_BIN, "gateway", "run", "--port", String(port)], {
      cwd: RAMU_ROOT,
      detached: true,
      windowsHide: true,
      stdio: ["ignore", out, out],
      env: { ...process.env, FORCE_COLOR: "0" },
    });
    closeSync(out);
    child.unref();
    console.log(`  Starting in the background (pid ${child.pid}); log: ${logFile}`);
    console.log(c.dim("  First start can take a few minutes while the engine warms up."));
    ready = await waitForGateway(port, child, logFile, timeoutSeconds);
  }

  console.log(c.bold("\n[4/4] Dashboard"));
  let dashboardUrl = `http://127.0.0.1:${port}/`;
  if (ready) {
    const dash = runRamu(["dashboard", "--no-open", "--json"], { capture: true });
    let details;
    try {
      details = JSON.parse(dash.stdout.slice(dash.stdout.indexOf("{")));
    } catch {
      details = undefined;
    }
    dashboardUrl = details?.url ?? dashboardUrl;
    const opened = openInBrowser(details?.browserUrl ?? dashboardUrl);
    console.log(opened ? `  ✓ Opened ${dashboardUrl} in your browser` : `  Open ${dashboardUrl} in your browser`);
  } else {
    console.log(c.yellow(`  Skipped: gateway is not ready. Try again with ${c.cyan("ramu")} or run ${c.cyan("ramu doctor")}.`));
  }

  const sync = readSyncStatus();
  console.log(`\n${c.dim("─".repeat(64))}`);
  console.log(ready ? c.green(c.bold(`  ${BRAND.product} is running.`)) : c.yellow(c.bold(`  ${BRAND.product} did not finish starting.`)));
  console.log(`  Dashboard:        ${c.cyan(dashboardUrl)}`);
  console.log(`  Connect WhatsApp: ${c.cyan("ramu whatsapp")}  ${c.dim("(or: npm run whatsapp)")}`);
  console.log(`  Choose a model:   ${c.cyan("ramu onboard")}   ${c.dim("(or: npm run onboard; local Ollama needs no API key)")}`);
  console.log(`  Health check:     ${c.cyan("ramu doctor")}`);
  if (sync?.engine?.version) {
    console.log(c.dim(`  Engine ${info.version}; last upstream check ${sync.checkedAt ?? "n/a"} (${sync.result ?? "unknown"}).`));
  }
  console.log(`${c.dim("─".repeat(64))}\n`);
  return ready ? 0 : 1;
}

/** WhatsApp ships as an installable plugin, not bundled with the engine. */
export function isPluginInstalled(id) {
  const list = runRamu(["plugins", "list", "--json"], { capture: true });
  try {
    const parsed = JSON.parse(list.stdout.slice(list.stdout.indexOf("{")));
    return parsed.plugins.some((plugin) => plugin.id === id);
  } catch {
    return false;
  }
}

export async function pairWhatsApp() {
  banner();
  const info = readEngineInfo();
  if (!info || !checkNode(info)) return 1;
  if (!isPluginInstalled("whatsapp")) {
    console.log("Installing the WhatsApp channel plugin (@openclaw/whatsapp)…");
    const install = runRamu(["plugins", "install", "@openclaw/whatsapp"]);
    if (install.status !== 0) {
      console.error(c.red("✗ Could not install the WhatsApp plugin. See the output above."));
      return install.status;
    }
  }
  console.log("\nOn your phone: WhatsApp → Settings → Linked devices → Link a device, then scan the QR code.\n");
  return runRamu(["channels", "login", "--channel", "whatsapp"]).status;
}

export function about() {
  const info = readEngineInfo();
  const stamp = info ? readBrandingStamp(info.root) : undefined;
  const sync = readSyncStatus();
  const pkg = readJson(path.join(RAMU_ROOT, "package.json")) ?? {};
  console.log(`${BRAND.product} ${pkg.version ?? ""} — ${BRAND.tagline}`);
  console.log(`  Engine:    ${info ? `openclaw ${info.version} (${info.commit?.slice(0, 7) ?? "?"})` : "not installed"}`);
  console.log(`  Branding:  ${stamp ? `applied ${stamp.appliedAt} (rules ${stamp.rulesHash})` : "not applied"}`);
  console.log(`  Upstream:  ${sync ? `${sync.result ?? "?"} at ${sync.checkedAt ?? "?"} (latest seen ${sync.upstream?.version ?? "?"})` : "no sync record"}`);
  console.log(`  Node:      ${process.versions.node}${info && !satisfiesNodeRange(process.versions.node, info.engines?.node) ? " (unsupported)" : ""}`);
  console.log(`  State dir: ${resolveStateDir()}`);
  console.log(`  Website:   ${BRAND.website}`);
  return 0;
}

