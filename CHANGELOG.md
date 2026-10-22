# Changelog — AI RAMU

All notable changes to the AI RAMU platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-22

### Added
- **AI RAMU Core Identity**: Complete original branding, vector logos, and tricolor saffron/green/charcoal UI design system ("Bolo Ramu, Kaam Shuru.").
- **Trilingual Engine**: Full native support for English, Hindi (`हिन्दी`), and Bengali (`বাংলা`) across UI, system prompts, and responses.
- **Multi-Provider AI Harness**: Out-of-the-box support for Google Gemini, OpenAI (GPT-4o), Anthropic Claude, Groq, and local offline Ollama, with automated graceful fallback.
- **Security Sandbox & Checkpoint Gate**: `FileSandbox` filesystem jail, `SecurityGuard` command filtering, prompt injection defense, and `ApprovalManager` for destructive operations.
- **Secret Redactor**: Automatic regex sanitization of credentials, API keys, and passwords from console and logs.
- **Automation Engine & Recipes**: Built-in Indian productivity workflows:
  - Indian GST Invoice Generator (`₹ INR` calculations, CGST/SGST/IGST breakdown).
  - Workspace File Organizer.
  - Daily Work Briefing Digest.
  - CSV Spreadsheet Quick Analyzer.
- **Web & Desktop Control Gateway**: High-performance local HTTP server serving the interactive Control UI (Chat, Task Queue, Automations, Connectors, Memory, Settings).
- **Connector Registry**: Modular interfaces for Local Filesystem, Web Browser automation, WhatsApp Gateway, Telegram Bot, and Google Workspace OAuth.
- **Memory & Transparency Center**: User-controlled long-term memory with inspection, selective deletion, and instant wipe controls.
- **Automated Test Suite**: 10 end-to-end tests covering security, i18n, workflows, and agent execution with 100% pass rate.
