# Maintaining AI RAMU

## Architecture

AI RAMU does not fork the engine's source. `package.json` pins the published `openclaw` npm
package at an exact version. On `npm install`, the `postinstall` hook runs
`scripts/rebrand-engine.mjs apply`, which edits the installed copy in `node_modules/openclaw`.

```
npm install
  └─ node_modules/openclaw@<pinned>            (upstream, MIT)
       └─ postinstall: rebrand-engine apply     (branding/rules.mjs)
            ├─ dist/**/*.{mjs,js,json} + openclaw.mjs   CLI/server text
            ├─ dist/control-ui/…                        dashboard text, icons, manifest
            ├─ rebuild .br/.gz, asset-manifest, sw.js boot graph
            ├─ rebuild dist/postinstall-content-inventory.json
            └─ write .ai-ramu-branding.json             (stamp: engine + rules hash)
bin/ramu.mjs → re-applies if the stamp is stale → runs the engine
```

Nothing in the engine's internal namespace is renamed: the package name `openclaw`,
`@openclaw/*` plugins, `OPENCLAW_*` env vars, `~/.openclaw`, HTTP headers, service and task
names, and storage keys all stay the same. Plugins therefore resolve their `openclaw` peer
dependency naturally, and existing user data keeps working.

## Branding rules (`branding/rules.mjs`)

| Rule | Effect |
| --- | --- |
| Targeted (`cli-name`, `default-tagline`, `fixed-tagline`, `banner-*`, `version-line`, `dashboard-title`) | Exact replacements. `required` rules **fail the rebrand** if upstream renames them, which blocks the sync. |
| `product-name` | Product name in prose → `AI RAMU`. Guards skip identifiers, paths, headers, file names, `"OpenClaw"`-exact strings in server code, `# …` profile markers and plist markers. |
| `command-hints` | `openclaw <subcommand>` → `ramu <subcommand>`, using the subcommand list parsed from the engine's own help. |
| `regex-prefixes` | `/^openclaw …/` → `/^(?:openclaw|ramu) …/`, so detection keeps matching legacy names. |

Workflow when the engine changes shape:

```sh
npm run rebrand:report     # dry run: every pending replacement with context
npm run rebrand            # apply
npm run rebrand:check      # rules applied + all integrity metadata consistent
npm test                   # regression tests (known leaks, identifiers, idempotency)
npm run verify:branding -- --all-commands
npm run smoke              # isolated gateway + live dashboard check (never touches ~/.openclaw)
```

Add every newly found leak to `test/rules.test.mjs` before fixing it.

Known remaining upstream-named text (deliberate or out of scope):
- Technical identifiers listed in `ALLOWED_IDENTIFIERS`, plus engine docs links (`docs.openclaw.ai`).
- Separately installed plugins (for example `@openclaw/whatsapp`) carry their own descriptions.
  Those come from npm at runtime and are not edited.
- Log lines written by the gateway use the engine's subsystem names.

## Upstream sync

`.github/workflows/upstream-sync.yml`:

1. **check** (03:00 and 15:00 UTC, or manual): compares the pin with the npm `latest` dist-tag.
   Betas are ignored. No change → the run ends.
2. **validate** (Linux and Windows): install candidate → `npm test` → `rebrand check` → branding scan
   of every command (Linux) → gateway/dashboard smoke test → `npm audit --audit-level=critical` (Linux).
3. **release**: `scripts/upstream.mjs update` pins the version, records `upstream/status.json`
   (current, last known-good, previous known-good) and appends `upstream/history.jsonl`. It pushes
   a `sync/openclaw-<version>` branch and fast-forwards `main`. It never force-pushes. If `main`
   moved meanwhile, the push fails and the next run retries.
4. **held** (on failure): opens or updates a GitHub issue. `main` is untouched.

The workflow is idempotent: re-running for the same version is a no-op unless `force` is set.

### Manual

```sh
npm run sync:check                 # what would change
npm run sync                       # update locally; restores the previous pin if any check fails
npm run sync -- --version 2026.x   # try a specific version
npm run rollback                   # back to previousKnownGood from upstream/status.json
```

Rollback on GitHub: revert the `chore(engine): update openclaw engine …` commit on `main`.

## Website

`website/` deploys to GitHub Pages through `.github/workflows/deploy-pages.yml` on pushes that
touch `website/**`. The custom domain `airamu.site` is set in the repository's Pages settings.

## Brand assets

`branding/assets/icon.svg` and `logo.svg` are the sources. `npm run brand:render` re-renders the
PNG and ICO files with a local Chrome or Edge, and you commit the output. The website copies them
into `website/assets/`.
