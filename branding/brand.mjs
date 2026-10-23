// Single source of truth for AI RAMU's user-facing identity.
export const BRAND = Object.freeze({
  product: "AI RAMU",
  cli: "ramu",
  tagline: "Bolo Ramu, Kaam Shuru.",
  headline: "Your AI, on WhatsApp.",
  description: "Free, open-source AI worker that runs on your own computer.",
  // Terminal decoration. Plain BMP glyph so it survives Windows consoles.
  mark: "✦",
  colors: Object.freeze({
    ink: "#16142B",
    paper: "#FBF8F3",
    saffron: "#FF8A00",
    rose: "#F43F5E",
    violet: "#9333EA",
    darkBg: "#0F0E1A",
  }),
  website: "https://airamu.site/",
  repository: "https://github.com/ganguydhrubo/ai-ramu",
  dashboardUrl: "http://127.0.0.1:18789/",
});

// The upstream engine AI RAMU is built on. Internal identifiers that keep these
// names (package name, env vars, state dir, plugin scopes) are deliberately kept.
export const ENGINE = Object.freeze({
  packageName: "openclaw",
  displayName: "OpenClaw",
  repository: "https://github.com/openclaw/openclaw",
  license: "MIT",
});
