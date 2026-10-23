// Explicit, reviewed branding rules applied to the installed engine package.
//
// Design constraints (see docs/BRANDING.md):
//  - Only user-facing text changes. Internal identifiers stay byte-identical:
//    package names (`openclaw`, `@openclaw/*`), env vars (`OPENCLAW_*`), the state
//    dir (`~/.openclaw`), config file names, HTTP headers (`X-OpenClaw-*`),
//    service/task names, mDNS labels, exported symbols and storage keys.
//  - Every rule is idempotent: its output never matches its own pattern.
//  - `required` rules must match (or already be applied) on every engine release;
//    if upstream renames the target, the rebrand fails loudly and the upstream
//    sync is blocked instead of shipping a half-branded build.
import { BRAND, ENGINE } from "./brand.mjs";

const NAME = ENGINE.displayName; // "OpenClaw"
const esc = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Characters that make a match part of an identifier, path, URL, header or key.
// "# OpenClaw …" and "<string>OpenClaw …" are markers the engine writes into shell
// profiles and launchd plists and later searches for, so they must not change.
const IDENT_BEFORE = String.raw`(?:(?<=\\n)|(?<![A-Za-z0-9_$.\-/@#\\^]))(?<!# )(?<!<string>)`;
const IDENT_AFTER =
  String.raw`(?![A-Za-z0-9_$/@#]|\\(?!n)|-[A-Z0-9]|\.(?:app|exe|json|json5|mjs|cjs|js|ts|plist|log|lnk|cmd|sh|ps1|md)\b| Nerd Symbols)`;

// Prose mentions of the upstream product name, e.g. "OpenClaw is thinking…",
// "Update OpenClaw", "OpenClawの", "OpenClaw-hosted tools".
export const PRODUCT_NAME_PATTERN = new RegExp(`${IDENT_BEFORE}${NAME}${IDENT_AFTER}`, "g");

// Top-level commands of engine 2026.10.6. The rebrand engine prefers the list it
// parses from the installed engine's own root help (see parseRootCommands).
export const FALLBACK_COMMANDS = (
  "acp agent agents approvals attach audit automations backup browser capability channels chat " +
  "completion config configure connect cron daemon dashboard database devices directory dns docs " +
  "doctor exec-approvals exec-policy file-transfer gateway health help hooks infer logs mcp memory " +
  "message migrate models node nodes onboard pairing plugins proxy qr reset resume sandbox secrets " +
  "security sessions setup skills status storage system telemetry terminal transcripts triage tui " +
  "uninstall update users webhooks worker worktrees"
).split(" ");

export function parseRootCommands(rootHelpText) {
  const commands = new Set();
  let inCommands = false;
  for (const line of String(rootHelpText ?? "").split("\n")) {
    if (/^Commands:/.test(line)) {
      inCommands = true;
      continue;
    }
    if (inCommands && /^\S/.test(line)) break;
    const match = inCommands && line.match(/^ {2}([a-z][a-z0-9-]*)(?: \*)? {2,}/);
    if (match) commands.add(match[1]);
  }
  return [...commands];
}

// Hard-coded command hints such as "run `openclaw doctor`" or "openclaw channels add".
// Only known subcommands match, so `npm install -g openclaw`, `openclaw.json`,
// `~/.openclaw`, `@openclaw/whatsapp`, argv arrays and phrases like "openclaw temp
// dir" are untouched. Anchored regex sources (`/^openclaw …/`) are handled by
// widenRegexPrefixes instead so they keep matching legacy names.
// "\n" escapes inside JSON/JS strings end in "n", so the escaped-newline case is
// allowed explicitly. Global-flag forms ("openclaw --dev gateway") count as hints,
// but not after package-manager installs ("npm i -g openclaw --foo").
const CMD_BEFORE = String.raw`(?:(?<=\\n)|(?<![A-Za-z0-9_$.\-/@#\\:^]))(?<!-g )(?<!install )(?<!add )`;
export function buildCommandHintPattern(commands = FALLBACK_COMMANDS) {
  const names = [...new Set(commands)].sort((a, b) => b.length - a.length).map(esc).join("|");
  return new RegExp(`${CMD_BEFORE}${ENGINE.packageName}(?= (?:(?:${names})(?![A-Za-z0-9_-])|--[a-z]|\\[))`, "g");
}
export const COMMAND_HINT_PATTERN = buildCommandHintPattern();

// `/^openclaw gateway \(.+\)$/` → `/^(?:openclaw|ramu) gateway \(.+\)$/`: accepts both
// the rewritten hints and names created by earlier installs (e.g. Windows tasks).
const REGEX_PREFIX_PATTERN = new RegExp(String.raw`(?<=[/(|])\^${ENGINE.packageName}(?![A-Za-z0-9_|-])`, "g");
export function widenRegexPrefixes(text) {
  let count = 0;
  const out = text.replace(REGEX_PREFIX_PATTERN, () => {
    count++;
    return `^(?:${ENGINE.packageName}|${BRAND.cli})`;
  });
  return { text: out, count };
}

const QUOTES = new Set(['"', "'", "`"]);

/**
 * In server/CLI code an exactly-quoted name ("OpenClaw", "OpenClaw Gateway") is
 * almost always an identifier: Windows task names, mDNS fallbacks, client display
 * names used for pairing. Those are left alone.
 */
export function isQuotedIdentifier(text, index, length) {
  const before = text[index - 1];
  if (!QUOTES.has(before)) return false;
  const rest = text.slice(index + length, index + length + 40);
  const closing = rest.match(/^(?: [A-Z][A-Za-z]+)?(.)/);
  return Boolean(closing && closing[1] === before);
}

export function replaceProductName(text, { skipQuotedIdentifiers }) {
  let count = 0;
  const out = text.replace(PRODUCT_NAME_PATTERN, (match, offset, whole) => {
    if (skipQuotedIdentifiers && isQuotedIdentifier(whole, offset, match.length)) return match;
    count++;
    return BRAND.product;
  });
  return { text: out, count };
}

export function replaceCommandHints(text, pattern = COMMAND_HINT_PATTERN) {
  let count = 0;
  const out = text.replace(pattern, () => {
    count++;
    return BRAND.cli;
  });
  return { text: out, count };
}

/**
 * Targeted rules. `scope` selects files (see scripts/rebrand-engine.mjs):
 *   cli      – dist/**\/*.{mjs,js} outside control-ui, plus cli-startup-metadata.json
 *   ui       – dist/control-ui/assets/*.js
 *   ui-html  – dist/control-ui/index.html (inline scripts are CSP-hashed: never touch them)
 * `applied` recognises output from a previous run so re-runs stay green.
 */
export const TARGETED_RULES = [
  {
    id: "cli-name",
    scope: "cli",
    required: true,
    description: "Command name used in usage lines, hints and completions",
    find: /const CLI_NAME = "openclaw";/g,
    replace: `const CLI_NAME = "${BRAND.cli}";`,
    applied: new RegExp(`const CLI_NAME = "${BRAND.cli}";`),
  },
  {
    id: "default-tagline",
    scope: "cli",
    required: true,
    description: "Banner tagline",
    find: /const DEFAULT_TAGLINE = "(?!Bolo Ramu)[^"]*";/g,
    replace: `const DEFAULT_TAGLINE = "${BRAND.tagline}";`,
    applied: new RegExp(`const DEFAULT_TAGLINE = "${esc(BRAND.tagline)}";`),
  },
  {
    id: "fixed-tagline",
    scope: "cli",
    required: true,
    description: "Always show the AI RAMU tagline instead of the random upstream pool",
    find: /function pickTagline\(options = \{\}\) \{\n\tif \(options\.mode === "off"\) return "";\n(?!\treturn DEFAULT_TAGLINE;)/g,
    replace: 'function pickTagline(options = {}) {\n\tif (options.mode === "off") return "";\n\treturn DEFAULT_TAGLINE;\n',
    applied: /function pickTagline\(options = \{\}\) \{\n\tif \(options\.mode === "off"\) return "";\n\treturn DEFAULT_TAGLINE;/,
  },
  {
    id: "banner-title",
    scope: "cli",
    required: true,
    description: "Banner product title and mark",
    find: /decorativePrefix\("[^"]+", "OpenClaw"/g,
    replace: `decorativePrefix("${BRAND.mark}", "${BRAND.product}"`,
    applied: new RegExp(`decorativePrefix\\("${BRAND.mark}", "${BRAND.product}"`),
  },
  {
    id: "banner-mark",
    scope: "cli",
    required: true,
    description: "Banner indent mark",
    find: /decorativeEmoji\("🦞"/g,
    replace: `decorativeEmoji("${BRAND.mark}"`,
    applied: new RegExp(`decorativeEmoji\\("${BRAND.mark}"`),
  },
  {
    id: "banner-art",
    scope: "cli",
    required: true,
    description: "Disable the upstream mascot ASCII art",
    find: /if \(!isLobsterDay\(now\)\) return null;/g,
    replace: "return null;",
    applied: /function pickCliLobsterArt\(now, env = process\.env\) \{\n\tif \(env\.CI \|\| env\.VITEST\) return null;\n\treturn null;/,
  },
  {
    id: "version-line",
    scope: "cli",
    required: true,
    description: "`ramu --version` output",
    find: /`OpenClaw \$\{VERSION\}/g,
    replace: `\`${BRAND.product} \${VERSION}`,
    applied: new RegExp(`\`${BRAND.product} \\$\\{VERSION\\}`),
  },
  {
    id: "prerendered-banner",
    scope: "cli",
    required: false,
    description: "Banner lines baked into cli-startup-metadata.json help texts",
    find: /(?:OpenClaw|AI RAMU) (\d+\.\d+\.\d+[^ "\\]*) \(([0-9a-f]+)\) — (?!Bolo Ramu)[^"\\]*/g,
    replace: `${BRAND.product} $1 ($2) — ${BRAND.tagline}`,
  },
  {
    id: "help-hint-argv",
    scope: "cli",
    required: false,
    description: "`Try: openclaw --help` hint assembled from an argv array",
    find: /formatCliCommand\(\[\n(\t*)"openclaw",/g,
    replace: `formatCliCommand([\n$1"${BRAND.cli}",`,
  },
  {
    id: "dashboard-title",
    scope: "ui-html",
    required: true,
    description: "Dashboard browser tab title",
    find: /<title>OpenClaw Control<\/title>/g,
    replace: `<title>${BRAND.product}</title>`,
    applied: new RegExp(`<title>${BRAND.product}</title>`),
  },
  {
    id: "dashboard-theme-color",
    scope: "ui-html",
    required: false,
    description: "Light theme-color matches the AI RAMU paper tone",
    find: new RegExp(
      `(<meta name="theme-color" media="\\(prefers-color-scheme: light\\)" content=")(?!${BRAND.colors.paper})#[0-9a-fA-F]{6}(" />)`,
      "g",
    ),
    replace: `$1${BRAND.colors.paper}$2`,
  },
];

// Files copied over the engine's dashboard icons.
export const UI_ICON_FILES = [
  { from: "favicon.svg", source: "icon.svg" },
  { from: "favicon-32.png", source: "favicon-32.png" },
  { from: "favicon.ico", source: "favicon.ico" },
  { from: "apple-touch-icon.png", source: "apple-touch-icon.png" },
  { from: "social-card.png", source: "social-card.png" },
];

export const UI_MANIFEST_PATCH = {
  name: BRAND.product,
  short_name: BRAND.product,
  description: `${BRAND.product} — ${BRAND.tagline}`,
  theme_color: BRAND.colors.darkBg,
  background_color: BRAND.colors.darkBg,
};

/**
 * Patterns the runtime verifier allows in user-visible output because they are
 * technical identifiers the user must type or read verbatim.
 */
export const ALLOWED_IDENTIFIERS = [
  /OPENCLAW_[A-Z0-9_]+/g, // environment variables
  /~?[\\/]?\.openclaw(?:-[a-z0-9_-]+)?\b/g, // state dir and profile dirs
  /openclaw\.json5?\b/g, // config file
  /openclaw\.mjs\b/g,
  /@openclaw\/[a-z0-9._-]+/g, // plugin packages
  /(?:docs\.)?openclaw\.ai\S*/g, // upstream documentation links
  /github\.com\/openclaw\/\S*/g,
  /clawhub\S*/gi,
  /ai\.openclaw\.[a-z.]+/g, // service labels
  /openclaw-[a-z0-9-]+/g, // service, task and plugin ids
  /X-OpenClaw-[A-Za-z-]+/g,
  /npm (?:i|install) -g openclaw\S*/g,
  /\[openclaw\]/g, // log prefix the engine parses back out of child stderr
  /\bopenclaw\/openclaw\b/g, // upstream GitHub repo slug (issue reporting)
  /[\\/]openclaw(?=[\\/])/g, // filesystem paths such as /tmp/openclaw/…
  /\bopenclaw(?:\.[a-z0-9-]+)+\b/g, // file names such as openclaw.patch.json5
];
