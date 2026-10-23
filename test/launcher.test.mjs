import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { resolveGatewayPort, satisfiesNodeRange } from "../lib/launcher.mjs";

test("node range matches the engine's requirement", () => {
  const range = ">=24.22.1 <25 || >=26.12.1";
  assert.equal(satisfiesNodeRange("24.19.0", range), false);
  assert.equal(satisfiesNodeRange("24.22.1", range), true);
  assert.equal(satisfiesNodeRange("25.1.0", range), false);
  assert.equal(satisfiesNodeRange("26.12.1", range), true);
  assert.equal(satisfiesNodeRange("22.0.0", undefined), true);
});

test("gateway port: env, then config (JSON and JSON5), then default", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "ramu-port-"));
  try {
    const config = path.join(dir, "openclaw.json");
    assert.equal(resolveGatewayPort({}, config), 18789);
    writeFileSync(config, JSON.stringify({ gateway: { mode: "local", port: 19001 } }));
    assert.equal(resolveGatewayPort({}, config), 19001);
    writeFileSync(config, "{ // json5\n  gateway: { mode: 'local', port: 19555, },\n}");
    assert.equal(resolveGatewayPort({}, config), 19555);
    assert.equal(resolveGatewayPort({ OPENCLAW_GATEWAY_PORT: "20000" }, config), 20000);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
