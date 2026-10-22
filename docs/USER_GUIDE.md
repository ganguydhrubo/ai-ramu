# AI RAMU User Guide

**Bolo Ramu, Kaam Shuru.**  
Your Indian AI Worker. Ready to Get Things Done.

---

## 1. Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/ganguydhrubo/ai-ramu.git
cd ai-ramu

# Install dependencies and build
npm install
npm run build
```

### Launching the Control Center

Start the local AI Ramu Gateway:

```bash
npm run gateway
```

Now open your browser and navigate to:
**http://127.0.0.1:8080**

---

## 2. CLI Usage

You can also interact directly with Ramu from your command line:

```bash
# Ask a question or assign a task in English
node dist/index.js chat "Generate a GST invoice for Sharma Enterprises"

# Ask in Hindi
node dist/index.js chat "नमस्ते रामू, आज की प्राथमिकताओं का विवरण दो।"

# Ask in Bengali
node dist/index.js chat "নমস্কার রামু, আমার ফাইলগুলো সাজিয়ে দাও।"

# List built-in automation recipes
node dist/index.js recipes
```

---

## 3. Connecting AI Providers

Configure your preferred model provider in `.env` or through the **Settings** tab in the Control Dashboard:

- **Google Gemini**: Set `GEMINI_API_KEY` (Free tier available).
- **OpenAI**: Set `OPENAI_API_KEY`.
- **Anthropic**: Set `ANTHROPIC_API_KEY`.
- **Groq**: Set `GROQ_API_KEY`.
- **Local Ollama**: Run `ollama run llama3.2` locally and configure `OLLAMA_BASE_URL=http://localhost:11434`.

---

## 4. Workflows & Automations

AI Ramu comes preloaded with ready-to-run Indian productivity workflows:
1. **GST Tax Invoice Generator**: Computes taxable amounts, CGST, SGST, IGST in ₹ INR, and exports to Markdown and HTML.
2. **Directory File Organizer**: Segregates workspace files into Documents, Data, Images, and Archives.
3. **Daily Work Briefing Digest**: Generates morning summary of tasks and pending approvals.
4. **CSV Spreadsheet Quick Analyzer**: Summarizes tabular data with row counts and key statistics.
