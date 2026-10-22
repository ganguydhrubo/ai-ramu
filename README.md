# AI RAMU 🇮🇳 — Bolo Ramu, Kaam Shuru.

<p align="center">
  <img src="src/server/static/assets/logo.svg" alt="AI RAMU Logo" width="460">
</p>

<p align="center">
  <strong>Your Indian AI Worker. Ready to Get Things Done.</strong><br>
  <em>Personal AI Worker, Desktop Agent and Automation Platform.</em>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#trilingual-engine">Languages</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#security--safe-autonomy">Security</a> •
  <a href="#documentation">Docs</a> •
  <a href="#license">License</a>
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

**AI RAMU** is an approachable, powerful personal AI worker and desktop automation agent tailored for India and global users. Unlike simple conversational chatbots, Ramu executes real digital work: generating tax-compliant GST invoices in ₹ INR, organizing local files, parsing CSV spreadsheets, synthesizing briefings, and orchestrating multi-channel interactions across WhatsApp, Telegram, and Google Workspace.

---

## 🌟 Highlights

- **Bilingual & Trilingual Fluency**: Built from day one for **English**, **Hindi (हिन्दी)**, and **Bengali (বাংলা)**.
- **Real Task Execution**: Executes deterministic desktop automations, sandboxed file operations, and structured document transformations.
- **Multi-Provider AI Harness**: Plug-and-play with **Google Gemini**, **OpenAI (GPT-4o)**, **Anthropic Claude**, **Groq**, and **Local Ollama** (offline mode).
- **Human-in-the-Loop Safeguards**: Mandatory approval checkpoints for destructive file or network operations.
- **Strict Sandbox Boundaries**: Enforced filesystem jail with automatic path traversal protection.
- **Zero-Secret Leakage**: Automatic real-time regex sanitization of credentials, API tokens, and passwords in all logs.
- **Commercial-Ready Foundation**: Clean dual-distribution architecture with comprehensive legal compliance and attribution.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: `v20.0.0` or later (Node 24 recommended).
- **Git**

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/ganguydhrubo/ai-ramu.git
cd ai-ramu

# Install dependencies and build
npm install
npm run build
```

### 3. Start the Control Dashboard

```bash
npm run gateway
```

Open your browser at **[http://127.0.0.1:8080](http://127.0.0.1:8080)** to access the AI RAMU Control Center!

### 4. Direct CLI Commands

```bash
# Ask a question or run a task in English
node dist/index.js chat "Generate a GST invoice for Sharma Enterprises"

# Command Ramu in Hindi
node dist/index.js chat "नमस्ते रामू, मेरे फाइलों को व्यवस्थित करो।"

# Command Ramu in Bengali
node dist/index.js chat "নমস্কার রামু, আমার নতুন কাজের সারাংশ দাও।"
```

---

## 🇮🇳 Trilingual Engine

AI Ramu natively understands Indian scripts and cultural context:

| Language | Motto / Tagline | Sample Instruction |
| :--- | :--- | :--- |
| **English** | *Bolo Ramu, Kaam Shuru.* | `"Create a tax invoice for ₹50,000"` |
| **हिन्दी (Hindi)** | *बोलो रामू, काम शुरू।* | `"शर्मा एंटरप्राइजेज के लिए १८% GST इनवॉइस बनाओ"` |
| **বাংলা (Bengali)** | *বলুন রামু, কাজ শুরু।* | `"আমার জন্য একটি দৈনিক কাজের ব্রিফিং প্রস্তুত করো"` |

---

## 🛡️ Security & Safe Autonomy

AI RAMU treats desktop execution as a privileged capability:
- **Sandbox Jail**: All file read/write operations are confined to `./workspace` (or your configured `RAMU_WORKSPACE`). Traversals (`../`) are blocked with `SandboxSecurityError`.
- **Command Guard**: Dangerous system destructive calls (`rm -rf`, `format`, `shutdown`, piped shell scripts) are proactively intercepted.
- **Prompt Injection Defense**: External inputs and web scrapes are scanned for prompt override signatures before LLM reasoning.
- **Secret Redactor**: Automatically replaces sensitive tokens (`sk-...`, `AIzaSy...`, bearer tokens) with `••••••••`.

---

## 📁 Repository Structure

```text
ai-ramu/
├── src/
│   ├── index.ts               # CLI Entry point ("ai-ramu")
│   ├── config.ts              # System configuration & environment
│   ├── brand.ts               # AI RAMU brand assets & constants
│   ├── core/
│   │   ├── agent.ts           # Central AI Ramu Worker Brain
│   │   ├── memory.ts          # Persistent memory store & privacy controls
│   │   ├── providers.ts       # Multi-provider LLM adapter (Gemini/OpenAI/Claude/Ollama)
│   │   └── i18n.ts            # Trilingual engine (English, Hindi, Bengali)
│   ├── security/
│   │   ├── sandbox.ts         # Path traversal & workspace containment
│   │   ├── approval.ts        # Human-in-the-loop checkpoint gates
│   │   ├── guard.ts           # Command whitelist & prompt injection blocker
│   │   └── redactor.ts        # Log secret & token masking
│   ├── automation/
│   │   ├── engine.ts          # Automation runner & scheduler
│   │   ├── queue.ts           # Task queue with live logs
│   │   └── recipes.ts         # Indian business & productivity workflows
│   ├── connectors/
│   │   ├── filesystem.ts      # Sandboxed file operations
│   │   ├── browser.ts         # Web scraping & browsing hook
│   │   ├── whatsapp.ts        # WhatsApp local gateway adapter
│   │   ├── telegram.ts        # Telegram bot connector
│   │   └── google.ts          # Google Workspace OAuth connector
│   └── server/
│       ├── gateway.ts         # Local HTTP & REST Gateway
│       └── static/            # AI RAMU Control UI (HTML/CSS/JS/SVG)
├── test/                      # End-to-end automated test suite (100% pass)
├── docs/                      # Architecture, User Guide, Troubleshooting, Policies
├── LEGAL_COMPLIANCE.md        # Licensing audit & compliance report
├── THIRD_PARTY_NOTICES.md     # Upstream copyright attribution
├── SECURITY.md                # Security disclosure policy
├── CHANGELOG.md               # Version history
└── LICENSE                    # MIT License
```

---

## 📖 Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [User Guide](docs/USER_GUIDE.md)
- [Troubleshooting & Diagnostics](docs/TROUBLESHOOTING.md)
- [Commercial Roadmap & Editions](docs/COMMERCIAL_ROADMAP.md)
- [Privacy Policy](docs/PRIVACY_POLICY.md)
- [Terms of Service](docs/TERMS_OF_SERVICE.md)
- [Legal Compliance Report](LEGAL_COMPLIANCE.md)

---

## ⚖️ License & Attribution

AI RAMU is licensed under the [MIT License](LICENSE) © 2026 ganguydhrubo & AI Ramu Contributors.

Portions of the underlying architecture adapt open concepts from upstream projects including [OpenClaw](https://github.com/openclaw/openclaw) (© 2026 OpenClaw Foundation), Pi (© 2025 Mario Zechner), and Hermes Agent (© 2025 Nous Research). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for full notices.
