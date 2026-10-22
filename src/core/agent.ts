import { RamuConfig } from "../config.js";
import { AgentMemory } from "./memory.js";
import { ModelProviderManager, LLMMessage } from "./providers.js";
import { ConnectorRegistry } from "../connectors/index.js";
import { FileSandbox } from "../security/sandbox.js";
import { SecurityGuard } from "../security/guard.js";
import { ApprovalManager } from "../security/approval.js";
import { TaskQueue } from "../automation/queue.js";
import { AutomationEngine } from "../automation/engine.js";
import { detectLanguage, getTranslation, SupportedLanguage } from "./i18n.js";
import { SecretRedactor } from "../security/redactor.js";

export interface AgentExecutionResult {
  reply: string;
  language: SupportedLanguage;
  provider: string;
  model: string;
  actionsTaken: string[];
  pendingApproval?: {
    id: string;
    description: string;
  };
}

export class RamuAgent {
  public config: RamuConfig;
  public memory: AgentMemory;
  public providers: ModelProviderManager;
  public sandbox: FileSandbox;
  public connectors: ConnectorRegistry;
  public approvalManager: ApprovalManager;
  public queue: TaskQueue;
  public automation: AutomationEngine;

  constructor(config: RamuConfig) {
    this.config = config;
    this.memory = new AgentMemory(config.dataDir);
    this.providers = new ModelProviderManager(config);
    this.sandbox = new FileSandbox(config.security.allowedDirectoryRoot);
    this.connectors = new ConnectorRegistry(config, this.sandbox);
    this.approvalManager = new ApprovalManager(config.security.requireApprovalForDestructive);
    this.queue = new TaskQueue();
    this.automation = new AutomationEngine(this.queue, this.connectors, this.approvalManager);
  }

  /**
   * Process a user instruction or query through the full AI RAMU pipeline.
   */
  public async processInput(userInput: string, preferredLang?: SupportedLanguage): Promise<AgentExecutionResult> {
    const actionsTaken: string[] = [];

    // 1. Prompt Injection & Threat Scan
    const threatCheck = SecurityGuard.scanForPromptInjection(userInput);
    if (!threatCheck.safe) {
      return {
        reply: `⚠️ **Security Alert**: Instruction was blocked by AI RAMU Security Guard. Reason: ${threatCheck.detectedThreat}`,
        language: preferredLang || "en",
        provider: "security-guard",
        model: "rule-based",
        actionsTaken: ["Blocked prompt injection attempt."],
      };
    }

    // 2. Language Detection
    const detectedLang = preferredLang || detectLanguage(userInput);
    const i18n = getTranslation(detectedLang);

    // 3. Record User Message in Memory
    this.memory.addMessage("user", userInput);

    // 4. Intent Classification & Deterministic Desktop Tool Calling
    const lower = userInput.toLowerCase();

    // Tool: Create GST Invoice
    if (lower.includes("invoice") || lower.includes("বিল") || lower.includes("रसीद")) {
      actionsTaken.push("Triggered GST Invoice Generator Workflow");
      const task = await this.automation.executeWorkflow("gst_invoice_generator", {
        clientName: "Sharma Enterprises",
        amount: 50000,
        gstRate: 18,
      });
      actionsTaken.push(`Created task ${task.id}`);
      const reply = detectedLang === "hi"
        ? `🧾 **AI RAMU**: मैंने आपका भारतीय GST इनवॉइस सफलतापूर्वक बना दिया है! यह आपके वर्कस्पेस में सेव हो गया है।\n\n*बोलो रामू, काम शुरू!*`
        : detectedLang === "bn"
        ? `🧾 **AI RAMU**: আপনার জিএসটি ইনভয়েস সফলভাবে প্রস্তুত করা হয়েছে এবং ওয়ার্কস্পেসে সেভ করা হয়েছে।\n\n*বলুন রামু, কাজ শুরু!*`
        : `🧾 **AI RAMU**: Your Indian GST Invoice has been generated and saved to your workspace under \`invoices/\`.\n\n*Bolo Ramu, Kaam Shuru!*`;

      this.memory.addMessage("assistant", reply);
      return {
        reply,
        language: detectedLang,
        provider: "automation-engine",
        model: "gst-invoice-v1",
        actionsTaken,
      };
    }

    // Tool: Organize Files
    if (lower.includes("organize") || lower.includes("व्यवस्थित") || lower.includes("সাজিয়ে")) {
      actionsTaken.push("Triggered Directory File Organizer Workflow");
      const task = await this.automation.executeWorkflow("workspace_organizer", { folderName: "." });
      actionsTaken.push(`Created task ${task.id}`);
      const reply = detectedLang === "hi"
        ? `📁 **AI RAMU**: वर्कस्पेस फ़ाइलों को श्रेणियों में व्यवस्थित कर दिया गया है। रिपोर्ट तैयार है।`
        : detectedLang === "bn"
        ? `📁 **AI RAMU**: সমস্ত ফাইল ক্যাটাগরি অনুযায়ী সাজানো হয়েছে। রিপোর্ট ওয়ার্কস্পেসে উপস্থিত।`
        : `📁 **AI RAMU**: Workspace directory cataloged and sorted into categorized folders.`;

      this.memory.addMessage("assistant", reply);
      return {
        reply,
        language: detectedLang,
        provider: "automation-engine",
        model: "file-organizer-v1",
        actionsTaken,
      };
    }

    // 5. LLM Call via Multi-Provider Harness
    const recentHistory = this.memory.getRecentMessages(10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const systemPrompt: LLMMessage = {
      role: "system",
      content: `${i18n.systemPromptGreeting}

Current user language: ${detectedLang}.
Allowed workspace root: "${this.sandbox.getAllowedRoot()}".
Always respond professionally, concisely, and action-oriented. Provide clear next steps.`,
    };

    const messages: LLMMessage[] = [systemPrompt, ...recentHistory];
    const response = await this.providers.generate(messages);

    // 6. Redact any sensitive credentials from response
    const sanitizedReply = SecretRedactor.redact(response.content);
    this.memory.addMessage("assistant", sanitizedReply);

    return {
      reply: sanitizedReply,
      language: detectedLang,
      provider: response.provider,
      model: response.model,
      actionsTaken,
    };
  }
}
