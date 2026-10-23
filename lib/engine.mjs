// Locates the installed upstream engine package and its branding stamp.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ENGINE } from "../branding/brand.mjs";

export const RAMU_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const STAMP_FILENAME = ".ai-ramu-branding.json";

export function resolveEngineRoot(fromDir = RAMU_ROOT) {
  // The engine's `exports` map hides package.json, so resolve its main entry
  // (dist/index.js) and walk up to the package root.
  let entry;
  try {
    entry = fileURLToPath(import.meta.resolve(ENGINE.packageName));
  } catch {
    entry = undefined;
  }
  const candidates = [];
  if (entry) {
    let dir = path.dirname(entry);
    while (dir !== path.dirname(dir)) {
      candidates.push(dir);
      dir = path.dirname(dir);
    }
  }
  candidates.push(path.join(fromDir, "node_modules", ENGINE.packageName));
  for (const dir of candidates) {
    const pkgPath = path.join(dir, "package.json");
    if (!existsSync(pkgPath)) continue;
    try {
      if (JSON.parse(readFileSync(pkgPath, "utf8")).name === ENGINE.packageName) return dir;
    } catch {
      // keep looking
    }
  }
  return undefined;
}

export function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

export function readEngineInfo(engineRoot = resolveEngineRoot()) {
  if (!engineRoot) return undefined;
  const pkg = readJson(path.join(engineRoot, "package.json")) ?? {};
  const build = readJson(path.join(engineRoot, "dist", "build-info.json")) ?? {};
  return {
    root: engineRoot,
    version: pkg.version,
    commit: build.commit,
    builtAt: build.builtAt,
    engines: pkg.engines,
    entry: path.join(engineRoot, "openclaw.mjs"),
  };
}

export function readBrandingStamp(engineRoot = resolveEngineRoot()) {
  return engineRoot ? readJson(path.join(engineRoot, STAMP_FILENAME)) : undefined;
}
