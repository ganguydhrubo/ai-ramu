# AI RAMU Troubleshooting & Diagnostics

---

## 1. Port 8080 Already in Use

If you encounter `EADDRINUSE: address already in use 127.0.0.1:8080`:

**Solution:**
Set a different port in your `.env` or pass the environment variable:
```bash
RAMU_PORT=8888 npm run gateway
```

---

## 2. API Key Issues

If Ramu falls back to the deterministic local engine:
- Verify that your API key is correctly saved in `.env` or set in the **Settings** tab.
- Check that your model provider account has active quota or credits.
- Ramu logs an explicit warning in the console when a provider call fails without crashing.

---

## 3. Sandbox Traversal Denials

If you see `SandboxSecurityError: Path traversal denied`:
- AI Ramu restricts file modifications strictly to the configured workspace root (`workspace/`).
- Ensure target file paths are located inside or relative to your workspace.

---

## 4. Multilingual Character Display

AI Ramu supports full Unicode UTF-8 output for Devanagari (Hindi) and Bengali. If your Windows terminal displays replacement characters:
- Run `chcp 65001` in PowerShell/Command Prompt before launching Ramu to enable UTF-8 terminal encoding.
