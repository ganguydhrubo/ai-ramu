#!/usr/bin/env node
// Dev-time tool: rasterizes branding/assets/*.svg into the PNG/ICO files that are
// committed to the repo. Needs a local Chrome or Edge; not used at install time.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "branding", "assets");

const browserCandidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const browser = browserCandidates.find((candidate) => existsSync(candidate));
if (!browser) {
  console.error("render-brand-assets: no Chrome/Edge found (set CHROME_PATH).");
  process.exit(1);
}

const tmp = mkdtempSync(path.join(os.tmpdir(), "ramu-render-"));

function screenshot(html, width, height, outFile) {
  const page = path.join(tmp, `page-${width}x${height}.html`);
  writeFileSync(page, html);
  execFileSync(browser, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--virtual-time-budget=6000",
    "--force-device-scale-factor=1",
    `--user-data-dir=${path.join(tmp, "profile")}`,
    "--default-background-color=00000000",
    `--window-size=${width},${height}`,
    `--screenshot=${outFile}`,
    pathToFileURL(page).href,
  ], { stdio: "ignore" });
  console.log(`✓ ${path.relative(root, outFile)}`);
}

const iconSvg = readFileSync(path.join(assets, "icon.svg"), "utf8");
const iconPage = (size) =>
  `<!doctype html><html><body style="margin:0;background:transparent">` +
  iconSvg.replace("<svg ", `<svg width="${size}" height="${size}" `) +
  `</body></html>`;

for (const [size, name] of [
  [32, "favicon-32.png"],
  [180, "apple-touch-icon.png"],
  [192, "icon-192.png"],
  [512, "icon-512.png"],
]) {
  screenshot(iconPage(size), size, size, path.join(assets, name));
}

// favicon.ico: a single 32x32 PNG wrapped in an ICO container (supported by all
// current browsers and Windows).
const png32 = readFileSync(path.join(assets, "favicon-32.png"));
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6);
header.writeUInt8(32, 7);
header.writeUInt8(0, 8);
header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png32.length, 14);
header.writeUInt32LE(22, 18);
writeFileSync(path.join(assets, "favicon.ico"), Buffer.concat([header, png32]));
console.log("✓ branding/assets/favicon.ico");

const fontLink =
  '<link rel="preconnect" href="https://fonts.googleapis.com">' +
  '<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Inter:wght@500&display=swap" rel="stylesheet">';
const cardIcon = iconSvg.replace("<svg ", '<svg width="148" height="148" ');
const socialCard = `<!doctype html><html><head>${fontLink}<style>
  body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:Inter,system-ui,sans-serif;
    background:radial-gradient(900px 520px at 88% -10%,#FFE2C2 0%,rgba(255,226,194,0) 60%),
      radial-gradient(800px 600px at -10% 110%,#F6D9FF 0%,rgba(246,217,255,0) 55%),#FBF8F3;color:#16142B}
  .wrap{position:absolute;inset:0;padding:84px 92px;display:flex;flex-direction:column;justify-content:space-between}
  .brand{display:flex;align-items:center;gap:28px}
  .name{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:92px;letter-spacing:-3px}
  .ai{background:linear-gradient(120deg,#FF8A00,#E11D74);-webkit-background-clip:text;color:transparent}
  h1{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:76px;line-height:1.02;letter-spacing:-2.5px;margin:0}
  .tag{font-size:30px;color:#5B5873;margin-top:20px}
  .pill{display:inline-flex;align-items:center;gap:12px;font-size:24px;color:#16142B;background:#fff;border:1px solid #ECE6DD;
    border-radius:999px;padding:12px 22px;box-shadow:0 10px 30px rgba(22,20,43,.08)}
  .dot{width:12px;height:12px;border-radius:50%;background:#22C55E}
</style></head><body><div class="wrap">
  <div class="brand">${cardIcon}<div class="name"><span class="ai">AI</span> RAMU</div></div>
  <div><h1>Your AI, on WhatsApp.</h1><div class="tag">Bolo Ramu, Kaam Shuru. — free &amp; open source, runs on your computer.</div></div>
  <div><span class="pill"><span class="dot"></span>Open source · MIT licensed</span></div>
</div></body></html>`;
screenshot(socialCard, 1200, 630, path.join(assets, "social-card.png"));

rmSync(tmp, { recursive: true, force: true });
