#!/usr/bin/env node
import { loadConfig } from "./config.js";
import { RamuAgent } from "./core/agent.js";
import { RamuGateway } from "./server/gateway.js";
import { BRAND } from "./brand.js";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "gateway";

  const config = loadConfig();
  const agent = new RamuAgent(config);

  if (command === "gateway" || command === "server") {
    console.log(BRAND.asciiArt);
    console.log(`[AI RAMU] Starting Gateway Control Center...`);
    console.log(`[AI RAMU] Host: http://${config.host}:${config.port}`);
    console.log(`[AI RAMU] Language: ${config.language}`);
    console.log(`[AI RAMU] Workspace Sandbox: ${agent.sandbox.getAllowedRoot()}`);
    console.log(`[AI RAMU] Active Provider: ${config.activeProvider}\n`);

    const gateway = new RamuGateway(agent);
    await gateway.start();
    return;
  }

  if (command === "chat" || command === "ask") {
    const prompt = args.slice(1).join(" ") || "Hello Ramu!";
    console.log(`[AI RAMU] Query: "${prompt}"`);
    const result = await agent.processInput(prompt);
    console.log(`\n${result.reply}\n`);
    return;
  }

  if (command === "recipes") {
    console.log(`\nAvailable AI RAMU Automation Recipes:\n`);
    for (const r of agent.automation.getAvailableRecipes()) {
      console.log(`- [${r.category}] ${r.name} (${r.id})`);
      console.log(`  ${r.description}\n`);
    }
    return;
  }

  console.log(`AI RAMU CLI — Bolo Ramu, Kaam Shuru.`);
  console.log(`Usage:`);
  console.log(`  ai-ramu gateway          Start the web & desktop control dashboard`);
  console.log(`  ai-ramu chat "<prompt>"  Ask Ramu to perform a task directly`);
  console.log(`  ai-ramu recipes          List built-in automation workflows`);
}

main().catch((err) => {
  console.error("[AI RAMU Fatal Error]:", err);
  process.exit(1);
});
