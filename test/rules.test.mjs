import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCommandHintPattern,
  parseRootCommands,
  replaceCommandHints,
  replaceProductName,
  widenRegexPrefixes,
} from "../branding/rules.mjs";
import { findLeaks } from "../scripts/verify-branding.mjs";

const cli = (text) => replaceCommandHints(replaceProductName(text, { skipQuotedIdentifiers: true }).text).text;
const ui = (text) => replaceCommandHints(replaceProductName(text, { skipQuotedIdentifiers: false }).text).text;

// Leaks reported against earlier AI RAMU builds (see AI_RAMU_MASTER_HANDOFF.md, bug 2).
test("known CLI leaks are rebranded", () => {
  assert.equal(cli("Next guided path: openclaw onboard."), "Next guided path: ramu onboard.");
  assert.equal(cli("Add a chat channel later: openclaw channels add."), "Add a chat channel later: ramu channels add.");
  assert.equal(cli("Run `openclaw doctor --fix`."), "Run `ramu doctor --fix`.");
  assert.equal(cli("`OpenClaw ${VERSION}`"), "`AI RAMU ${VERSION}`");
  assert.equal(cli('"Manage OpenClaw\'s dedicated browser"'), '"Manage AI RAMU\'s dedicated browser"');
  assert.equal(ui("thinking:`OpenClaw is thinking`"), "thinking:`AI RAMU is thinking`");
  assert.equal(ui("placeholder:`OpenClawにメッセージを送信…`"), "placeholder:`AI RAMUにメッセージを送信…`");
  assert.equal(ui("OpenClaw-hosted tools"), "AI RAMU-hosted tools");
  assert.equal(ui('<span class="topbar-brand__title">OpenClaw</span>'), '<span class="topbar-brand__title">AI RAMU</span>');
});

// Found by the end-to-end smoke test on engine 2026.10.6.
test("pre-rendered help and flag-style hints are rebranded", () => {
  assert.equal(cli('"browserHelpText": "\\nOpenClaw 2026.10.6 (fe06181) — x"'), '"browserHelpText": "\\nAI RAMU 2026.10.6 (fe06181) — x"');
  assert.equal(cli("Examples:\\n  openclaw --dev gateway"), "Examples:\\n  ramu --dev gateway");
  assert.equal(cli("openclaw --update  # Shorthand"), "ramu --update  # Shorthand");
  assert.equal(cli("\\nopenclaw doctor"), "\\nramu doctor");
  assert.equal(cli("npm i -g openclaw --allow-scripts"), "npm i -g openclaw --allow-scripts");
  assert.equal(cli("npm install openclaw --save"), "npm install openclaw --save");
});

test("verifier treats repo slugs, paths and file names as identifiers", () => {
  assert.deepEqual(findLeaks("create an openclaw/openclaw issue; /tmp/openclaw/uploads; ./openclaw.patch.json5"), []);
});

test("technical identifiers are preserved", () => {
  const keep = [
    "npm install -g openclaw@latest",
    "~/.openclaw/openclaw.json",
    "OPENCLAW_STATE_DIR",
    "@openclaw/whatsapp",
    "X-OpenClaw-Token",
    "n.OpenClawNativeGatewayAuth",
    "includeInOpenClawGroup",
    "nav.askOpenClaw",
    '"JetBrains Mono", "OpenClaw Nerd Symbols"',
    "/Applications/OpenClaw.app",
    "openclaw.control.settings.v1",
    "ai.openclaw.gateway",
    "# OpenClaw Completion",
    "<string>OpenClaw Gateway</string>",
    "OpenClaw-Aktivität",
    "/tmp/openclaw/trace.zip",
    "openclaw temp dir",
  ];
  for (const text of keep) assert.equal(ui(text), text, text);
});

test("quoted identifiers stay untouched in CLI code but not in UI", () => {
  assert.equal(cli('const GATEWAY_WINDOWS_TASK_NAME = "OpenClaw Gateway";'), 'const GATEWAY_WINDOWS_TASK_NAME = "OpenClaw Gateway";');
  assert.equal(cli('fallback = "OpenClaw")'), 'fallback = "OpenClaw")');
  assert.equal(ui("brandName:`OpenClaw`"), "brandName:`AI RAMU`");
});

test("anchored regexes accept both names", () => {
  const out = widenRegexPrefixes("/^openclaw gateway \\(.+\\)$/.test(x) || /^openclaw plugins install /u").text;
  assert.equal(out, "/^(?:openclaw|ramu) gateway \\(.+\\)$/.test(x) || /^(?:openclaw|ramu) plugins install /u");
  assert.ok(new RegExp("^(?:openclaw|ramu) gateway \\(.+\\)$").test("openclaw gateway (work)"));
});

test("all transforms are idempotent", () => {
  const input = "Run openclaw doctor; OpenClaw is ready. /^openclaw gateway/";
  const once = widenRegexPrefixes(cli(input)).text;
  assert.equal(widenRegexPrefixes(cli(once)).text, once);
});

test("command list parsing follows the engine help", () => {
  const help = "Usage: ramu\n\nCommands:\n  Hint: x\n  acp *                Run\n  doctor               Fix\n\nExamples:\n  ramu x";
  assert.deepEqual(parseRootCommands(help), ["acp", "doctor"]);
  const pattern = buildCommandHintPattern(["doctor"]);
  assert.equal(replaceCommandHints("openclaw doctor and openclaw status", pattern).text, "ramu doctor and openclaw status");
});

test("leak finder allows identifiers and flags product names", () => {
  assert.deepEqual(findLeaks("Config: ~/.openclaw/openclaw.json (OPENCLAW_CONFIG_PATH), docs https://docs.openclaw.ai/cli"), []);
  assert.equal(findLeaks("Welcome to OpenClaw").length, 1);
  assert.equal(findLeaks("run openclaw doctor").length, 1);
});
