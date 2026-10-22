# AI RAMU System Architecture

```text
                     +---------------------------------------+
                     |         AI RAMU Control Center        |
                     |  (Web Dashboard / Desktop GUI / CLI)  |
                     +-------------------+-------------------+
                                         | HTTP / REST & WebSockets
                                         v
+---------------------------------------------------------------------------------+
|                                 AI RAMU GATEWAY                                 |
|                                                                                 |
|  +--------------------+   +-----------------------+   +----------------------+  |
|  |   Trilingual Engine|   |   Approval Manager    |   |    Secret Redactor   |  |
|  |   (EN / HI / BN)   |   |   (Human-in-the-Loop) |   |  (Credential Masking)|  |
|  +--------------------+   +-----------------------+   +----------------------+  |
|                                                                                 |
|  +---------------------------------------------------------------------------+  |
|  |                            AI RAMU AGENT CORE                             |  |
|  |  +------------------------+  +-------------------+  +-------------------+ |  |
|  |  | Multi-Provider Harness |  | Long-Term Memory  |  | Security Guard    | |  |
|  |  | (Gemini/OpenAI/Claude) |  | (Memory Store)    |  | (Injection Defense| |  |
|  |  +------------------------+  +-------------------+  +-------------------+ |  |
|  +-------------------------------------+-------------------------------------+  |
|                                        |                                        |
|  +-------------------------------------+-------------------------------------+  |
|  |                         AUTOMATION & TASK QUEUE                           |  |
|  |  +------------------------+  +-------------------+  +-------------------+ |  |
|  |  | Indian GST Invoicing   |  | Directory Sorting |  | Daily Briefing    | |  |
|  |  +------------------------+  +-------------------+  +-------------------+ |  |
|  +-------------------------------------+-------------------------------------+  |
|                                        |                                        |
|  +-------------------------------------+-------------------------------------+  |
|  |                       CONNECTOR & INTEGRATION MESH                        |  |
|  |  +--------------------+  +-------------------+  +-----------------------+ |  |
|  |  | Filesystem Sandbox |  | Web Browser Engine|  | Messaging (WA/TG/GWS) | |  |
|  |  +--------------------+  +-------------------+  +-----------------------+ |  |
|  +---------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------+
```

## Key Architectural Principles

1. **Local-First & Sovereign Execution**:
   - AI Ramu runs on the user's host machine.
   - All tasks, logs, conversation states, and working documents are stored locally in the configured workspace directory.

2. **Strict Filesystem Sandboxing**:
   - The agent is sandboxed inside `RAMU_WORKSPACE`. Any path escaping via directory traversal (`../`) is intercepted and rejected by `FileSandbox`.

3. **Multi-Provider Agility**:
   - The agent is decoupled from any single proprietary AI model. It supports Google Gemini, Anthropic Claude, OpenAI, Groq, and local Ollama.

4. **Human-in-the-Loop Safeguards**:
   - Destructive operations require explicit approval before execution.
