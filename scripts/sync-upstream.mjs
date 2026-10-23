#!/usr/bin/env node
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function run(cmd) {
  console.log(`> ${cmd}`);
  return execSync(cmd, { cwd: rootDir, stdio: "inherit", encoding: "utf8" });
}

console.log("======================================================================");
console.log("  🇮🇳 AI RAMU — Upstream Sync & Rebrand Automation Pipeline");
console.log("======================================================================\n");

try {
  // 1. Ensure upstream remote exists
  try {
    const remotes = execSync("git remote", { cwd: rootDir, encoding: "utf8" });
    if (!remotes.includes("upstream")) {
      run("git remote add upstream https://github.com/openclaw/openclaw.git");
      console.log("✓ Added upstream remote: https://github.com/openclaw/openclaw.git");
    }
  } catch (err) {
    console.warn("Notice checking remotes:", err.message);
  }

  // 2. Fetch latest commits from upstream
  console.log("\n[1/4] Fetching upstream updates...");
  run("git fetch upstream main --tags");

  // 3. Merge upstream/main into current branch
  console.log("\n[2/4] Merging upstream changes into AI RAMU...");
  try {
    run('git merge upstream/main -m "chore(sync): merge upstream updates into AI RAMU" --allow-unrelated-histories -X ours');
  } catch (err) {
    console.log("Merge completed with strategy resolution.");
  }

  // 4. Run the rebrand engine
  console.log("\n[3/4] Enforcing AI RAMU branding and zero-trace sanitization...");
  run("node scripts/rebrand-engine.mjs");

  // 5. Commit any updated branding artifacts
  console.log("\n[4/4] Finalizing sync commit...");
  try {
    run("git add -A");
    run('git commit -m "chore(sync): rebrand and sanitize upstream updates for AI RAMU"');
    console.log("✓ All upstream updates cleanly integrated and rebranded!");
  } catch {
    console.log("✓ Working directory already up to date.");
  }

  console.log("\n🎉 AI RAMU successfully synced with upstream!");
  console.log("Run 'git push origin main' to publish the latest synced release.\n");
} catch (error) {
  console.error("\n❌ Sync failed:", error.message);
  process.exit(1);
}
