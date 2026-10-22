import fs from "node:fs";
import path from "node:path";

const src = path.resolve("src/server/static");
const dest = path.resolve("dist/server/static");

if (fs.existsSync(src)) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log(`[AI RAMU Build] Copied static assets to dist/server/static.`);
}
