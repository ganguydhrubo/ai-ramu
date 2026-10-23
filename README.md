<p align="center">
  <img src="branding/assets/icon-192.png" width="96" height="96" alt="AI RAMU">
</p>

<h1 align="center">AI RAMU</h1>
<p align="center"><b>Your AI, on WhatsApp.</b> — <i>Bolo Ramu, Kaam Shuru.</i></p>

<p align="center">
  <a href="https://github.com/ganguydhrubo/ai-ramu/actions/workflows/ci.yml"><img src="https://github.com/ganguydhrubo/ai-ramu/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/ganguydhrubo/ai-ramu/actions/workflows/upstream-sync.yml"><img src="https://github.com/ganguydhrubo/ai-ramu/actions/workflows/upstream-sync.yml/badge.svg" alt="Upstream sync"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-16142B" alt="MIT"></a>
</p>

AI RAMU is a free, open-source AI worker that runs on **your own computer**. Link it to your
WhatsApp as a linked device and message it like a person. It can browse the web, work with
files in its workspace, run scheduled jobs and answer with the AI model you choose. A local
dashboard shows chats, channels, schedules, logs and health checks.

AI RAMU is a branded distribution of the MIT-licensed [OpenClaw](https://github.com/openclaw/openclaw)
engine. It adds its own identity, launcher, Windows one-click start, twice-daily tested engine
updates and this website. See [Third-party notices](THIRD_PARTY_NOTICES.md).

## Quick start

You need **Node.js 24.22.1 or newer** (24 LTS) — `winget install OpenJS.NodeJS.LTS` on Windows.

```sh
git clone https://github.com/ganguydhrubo/ai-ramu
cd ai-ramu
npm install          # installs the engine and applies AI RAMU branding
npm start            # starts the gateway in the background and opens the dashboard
npm run onboard      # choose a model (Ollama = local, no API key)
npm run whatsapp     # installs the WhatsApp channel and shows the pairing QR
```

**Windows:** double-click `START_AI_RAMU.bat`. It checks Node.js (and offers to install it with
winget), installs on first run, links the `ramu` command, starts the gateway once and opens the
dashboard. `OPEN_DASHBOARD.bat` reopens the dashboard without starting a second gateway.

After `START_AI_RAMU.bat` (or `npm link`) the `ramu` command works in any terminal:

| Command | What it does |
| --- | --- |
| `ramu` / `ramu start` | Prepare config, start the gateway if it is not running, open the dashboard |
| `ramu whatsapp` | Install the WhatsApp channel if needed and show the pairing QR code |
| `ramu onboard` | Guided model / channel setup |
| `ramu doctor` | Health checks and repairs |
| `ramu about` | AI RAMU, engine, branding and update status |
| `ramu <command>` | Any engine command (`channels`, `cron`, `models`, `plugins`, `gateway`, …) |

## Models and cost

AI RAMU itself is free (MIT). It does not sell anything or gate features. The AI model is your
choice:

- **Local, no API key:** Ollama, LM Studio, vLLM or SGLang running on your machine.
- **Cloud providers** (Google Gemini, OpenRouter, OpenAI, Anthropic, Groq and others) need your own
  key. They set their own prices and free-tier limits, which can change. AI RAMU never switches to
  a paid model for you.

## Where your data lives

The engine keeps its config, sessions, workspace and WhatsApp credentials in your user folder
(`%USERPROFILE%\.openclaw` on Windows, `~/.openclaw` elsewhere). That folder name is an engine
identifier and is kept on purpose, so existing installs and plugins keep working. Nothing there is
committed to this repository, and updates never touch it.

## Updates

A GitHub Actions workflow checks for a new stable engine release at about 03:00 and 15:00 UTC
(08:30 / 20:30 IST). Each candidate is installed, branded and tested on Linux and Windows: unit
tests, rebrand and integrity check, branding scan of every CLI command, gateway and dashboard smoke
test, and `npm audit`. Only then is `main` fast-forwarded. A failing candidate is held, and a
GitHub issue is opened. To update a local install, `git pull` then `npm install`. Details,
manual sync and rollback: [docs/MAINTAINING.md](docs/MAINTAINING.md).

## Project layout

```
bin/ramu.mjs              CLI entry (launcher + pass-through to the engine)
lib/                      launcher and engine locator
branding/                 brand constants, rebrand rules, logo and icons
scripts/rebrand-engine.mjs   applies/checks branding on node_modules/openclaw
scripts/verify-branding.mjs  runtime leak scan (CLI + live dashboard)
scripts/smoke.mjs            isolated end-to-end gateway test
scripts/upstream.mjs         check / update / rollback engine versions
upstream/                 status.json (current + last known-good) and history
website/                  airamu.site (GitHub Pages)
```

## License

MIT. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
