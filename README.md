# AI RAMU 🇮🇳 — Bolo Ramu, Kaam Shuru.

<p align="center">
  <strong>Your Indian AI Worker. Ready to Get Things Done.</strong><br>
  <em>Personal AI Worker, Desktop Agent, and Multi-Channel Automation Platform.</em>
</p>

<p align="center">
  <a href="https://github.com/ganguydhrubo/ai-ramu/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/ganguydhrubo/ai-ramu/ci.yml?branch=main&style=flat-square&label=ci" alt="CI status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License: MIT"></a>
</p>

---

```text
   ___    ___   ____     _    __  __ _   _ 
  / _ \  |_ _| |  _ \   / \  |  \/  | | | |
 / /_\ \  | |  | |_) | / _ \ | |\/| | | | |
|  _  | | | |  |  _ < / ___ \| |  | | |_| |
|_| |_| |___|  |_| \_/_/   \_\_|  |_|\___/ 
          Bolo Ramu, Kaam Shuru.
```

**AI RAMU** is an autonomous personal AI worker and desktop automation assistant tailored for India and global users. It runs on your own hardware, operates your computer, and meets you wherever you communicate: **WhatsApp**, **Telegram**, **Discord**, **Slack**, **iMessage**, plus a rich local web Control Center and terminal UI.

---

## 🌟 Capabilities

- **Direct WhatsApp Web Pairing**: Scan an ASCII QR code directly in your terminal using WhatsApp Mobile (Linked Devices) to command your agent from anywhere.
- **Multilingual Persona**: Fluent in English, Hindi (हिन्दी), and Bengali (বাংলা).
- **Desktop & Computer Control**: Automate file operations, execute approved shell commands, manage browser tasks, and create structured documents.
- **Multi-Provider AI Harness**: Connects to Google Gemini, OpenAI (GPT-4o), Anthropic Claude, Groq, or local offline Ollama models.
- **Privacy & Sovereignty**: All credentials, local state, memory files, and conversation history live on your own machine.
- **Safety First**: Human-in-the-loop checkpoints, filesystem sandboxing, and sensitive credential log redaction.

---

## ⚡ Quick Start & Installation

### 1. Global CLI Installation
```powershell
# In Windows PowerShell:
npm install -g openclaw@latest --allow-scripts=openclaw
```

### 2. Run the Interactive Onboarding Wizard
Launch the guided setup wizard in your terminal:
```bash
openclaw onboard
```
* Grant system file access permissions
* Choose your AI model provider (OpenAI, Gemini, Claude, MiniMax, Groq, Ollama)
* Enter your API key
* Select your preferred communication channels (WhatsApp, Telegram, etc.)
* Choose your persona identity

---

### 3. Pair with WhatsApp
To link WhatsApp via QR code directly:
```bash
openclaw channels login --channel whatsapp
```
1. Open **WhatsApp** on your phone.
2. Tap **Settings / More Options** > **Linked Devices** > **Link a Device**.
3. Scan the QR code displayed in your terminal.
4. Your number is now paired! Message your bot to run automations and control your computer.

---

### 4. Open the Web Dashboard
```bash
openclaw dashboard
```
Opens your local Control Center in your browser at `http://127.0.0.1:18789/`.

---

## 📁 Repository Structure

* `openclaw.mjs` / `ramu.mjs`: CLI Entry points
* `extensions/whatsapp`: Official WhatsApp Web connector (powered by Baileys)
* `extensions/telegram`: Official Telegram bot connector
* `extensions/browser`: Dedicated headless/headful browser automation
* `extensions/google`: Google Workspace integration
* `src/wizard`: Interactive terminal onboarding wizard
* `LEGAL_COMPLIANCE.md`: Licensing and compliance report
* `THIRD_PARTY_NOTICES.md`: Full open-source attribution

---

## ⚖️ License & Attribution

AI RAMU is distributed under the [MIT License](LICENSE) © 2026 ganguydhrubo & AI Ramu Contributors.

This product adapts and builds upon the open-source [OpenClaw](https://github.com/openclaw/openclaw) project (© 2026 OpenClaw Foundation and Peter Steinberger) and incorporates open-source components including Baileys, SQLite, Pi, and Hermes Agent. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for full notices and details.
