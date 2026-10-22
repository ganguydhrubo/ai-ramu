# Security Policy — AI RAMU

AI RAMU is designed as a privileged desktop assistant and automation platform. Because it interacts with files, processes, and network services, security is a first-class priority.

---

## 1. Security Architecture & Threat Model

1. **Filesystem Sandbox Boundary**:
   - File operations are constrained to an authorized workspace directory (`RAMU_WORKSPACE` / `ALLOWED_DIRECTORY_ROOT`).
   - Relative path traversals (`../`) that escape the jail are immediately rejected by `FileSandbox`.

2. **Human-in-the-Loop Checkpoints**:
   - Destructive operations (permanent file deletion, external email sending, system configuration changes) require explicit user approval.

3. **Command Guard & Prompt Injection Defense**:
   - Shell commands are audited against a strict blacklist to prevent system destruction (`rm -rf`, `format`, `shutdown`, raw curl pipes).
   - Untrusted web content and inputs are scanned for prompt injection signatures before insertion into agent reasoning.

4. **Credential Isolation & Redaction**:
   - Secrets, bearer tokens, and API keys are redacted automatically from stdout, stderr, and log files.
   - Credentials are never logged or exported in telemetry.

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability in AI RAMU, please do not disclose it publicly via GitHub issues.

**To report a vulnerability:**
- Email: `security@ganguydhrubo.dev` (or open a confidential security advisory on GitHub: [Security Advisories](https://github.com/ganguydhrubo/ai-ramu/security/advisories)).
- Include steps to reproduce, affected versions, and potential impact.
- We acknowledge reports within 48 hours and work with you on a coordinated disclosure timeline.
