import { RamuConfig } from "../config.js";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class ModelProviderManager {
  private config: RamuConfig;

  constructor(config: RamuConfig) {
    this.config = config;
  }

  public async generate(messages: LLMMessage[]): Promise<LLMResponse> {
    const provider = this.config.activeProvider;

    // 1. Google Gemini
    if (provider === "gemini" && this.config.apiKeys.gemini) {
      try {
        return await this.callGemini(messages);
      } catch (err: any) {
        console.warn(`[AI RAMU] Gemini API call failed (${err.message}), trying fallback...`);
      }
    }

    // 2. OpenAI
    if (provider === "openai" && this.config.apiKeys.openai) {
      try {
        return await this.callOpenAI(messages);
      } catch (err: any) {
        console.warn(`[AI RAMU] OpenAI API call failed (${err.message}), trying fallback...`);
      }
    }

    // 3. Anthropic
    if (provider === "anthropic" && this.config.apiKeys.anthropic) {
      try {
        return await this.callAnthropic(messages);
      } catch (err: any) {
        console.warn(`[AI RAMU] Anthropic API call failed (${err.message}), trying fallback...`);
      }
    }

    // 4. Groq
    if (provider === "groq" && this.config.apiKeys.groq) {
      try {
        return await this.callGroq(messages);
      } catch (err: any) {
        console.warn(`[AI RAMU] Groq API call failed (${err.message}), trying fallback...`);
      }
    }

    // 5. Local Ollama
    if (provider === "ollama") {
      try {
        return await this.callOllama(messages);
      } catch (err: any) {
        console.warn(`[AI RAMU] Ollama call failed (${err.message}). Local service might be offline.`);
      }
    }

    // 6. Built-in Deterministic Assistant Engine (Offline Fallback)
    return this.fallbackDeterministicResponse(messages);
  }

  private async callGemini(messages: LLMMessage[]): Promise<LLMResponse> {
    const apiKey = this.config.apiKeys.gemini;
    const model = this.config.models.gemini;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const systemInstruction = messages.find((m) => m.role === "system");

    const payload: any = { contents };
    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction.content }],
      };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini returned status ${res.status}: ${errText}`);
    }

    const data: any = await res.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return {
      content: candidate,
      provider: "gemini",
      model,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
    };
  }

  private async callOpenAI(messages: LLMMessage[]): Promise<LLMResponse> {
    const apiKey = this.config.apiKeys.openai;
    const model = this.config.models.openai;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI status ${res.status}: ${err}`);
    }

    const data: any = await res.json();
    return {
      content: data.choices?.[0]?.message?.content || "",
      provider: "openai",
      model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }

  private async callAnthropic(messages: LLMMessage[]): Promise<LLMResponse> {
    const apiKey = this.config.apiKeys.anthropic;
    const model = this.config.models.anthropic;

    const systemMsg = messages.find((m) => m.role === "system")?.content || "";
    const conversation = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        system: systemMsg,
        messages: conversation,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic status ${res.status}: ${err}`);
    }

    const data: any = await res.json();
    return {
      content: data.content?.[0]?.text || "",
      provider: "anthropic",
      model,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    };
  }

  private async callGroq(messages: LLMMessage[]): Promise<LLMResponse> {
    const apiKey = this.config.apiKeys.groq;
    const model = this.config.models.groq;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq status ${res.status}: ${err}`);
    }

    const data: any = await res.json();
    return {
      content: data.choices?.[0]?.message?.content || "",
      provider: "groq",
      model,
    };
  }

  private async callOllama(messages: LLMMessage[]): Promise<LLMResponse> {
    const baseUrl = this.config.ollamaBaseUrl;
    const model = this.config.models.ollama;

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama status ${res.status}`);
    }

    const data: any = await res.json();
    return {
      content: data.message?.content || "",
      provider: "ollama",
      model,
    };
  }

  private fallbackDeterministicResponse(messages: LLMMessage[]): LLMResponse {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const lower = lastUserMessage.toLowerCase();

    let reply = "";
    if (lower.includes("invoice") || lower.includes("বিল") || lower.includes("रसीद")) {
      reply = `🧾 **AI RAMU Task Worker**: I have prepared your automated Invoice workflow. Please confirm client name, amount in ₹ (INR), and tax details so I can generate your formatted PDF/CSV file.\n\n*Bolo Ramu, Kaam Shuru!*`;
    } else if (lower.includes("organize") || lower.includes("file") || lower.includes("ফাইল")) {
      reply = `📁 **AI RAMU Desktop Worker**: Scanning your target directory. I will group files by type (Documents, Images, Archives) into categorized folders inside your workspace safely.\n\n*Bolo Ramu, Kaam Shuru!*`;
    } else if (lower.includes("email") || lower.includes("mail") || lower.includes("ইমেইল")) {
      reply = `✉️ **AI RAMU Communications**: Email draft initialized. You can review the draft and click Approve before any message is sent.\n\n*Bolo Ramu, Kaam Shuru!*`;
    } else {
      reply = `🇮🇳 **Bolo Ramu, Kaam Shuru!**\n\nI received your instruction: "${lastUserMessage}".\n\nI am your Indian AI Worker. To connect me to a live frontier model, set your preferred API key in **Settings** (Gemini, OpenAI, Anthropic, or local Ollama). Meanwhile, my automated task execution engine and security sandbox are fully active and ready to execute desktop workflows.`;
    }

    return {
      content: reply,
      provider: "ramu-local-engine",
      model: "deterministic-v1",
    };
  }
}
