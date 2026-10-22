import fs from "node:fs";
import path from "node:path";

export interface MessageRecord {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface MemoryData {
  facts: string[];
  conversations: MessageRecord[];
  preferences: Record<string, string>;
}

export class AgentMemory {
  private memoryFilePath: string;
  private data: MemoryData;

  constructor(dataDir: string) {
    this.memoryFilePath = path.join(dataDir, "memory.json");
    this.data = this.load();
  }

  private load(): MemoryData {
    if (fs.existsSync(this.memoryFilePath)) {
      try {
        const raw = fs.readFileSync(this.memoryFilePath, "utf8");
        return JSON.parse(raw);
      } catch {
        // Fallback on corrupt file
      }
    }
    return {
      facts: [],
      conversations: [],
      preferences: {
        language: "en",
        theme: "dark",
      },
    };
  }

  public save(): void {
    fs.writeFileSync(this.memoryFilePath, JSON.stringify(this.data, null, 2), "utf8");
  }

  public addMessage(role: "user" | "assistant" | "system", content: string): MessageRecord {
    const record: MessageRecord = {
      id: Math.random().toString(36).substring(2, 10),
      role,
      content,
      timestamp: Date.now(),
    };
    this.data.conversations.push(record);
    // Keep last 100 messages in rolling window
    if (this.data.conversations.length > 100) {
      this.data.conversations.shift();
    }
    this.save();
    return record;
  }

  public getRecentMessages(limit: number = 20): MessageRecord[] {
    return this.data.conversations.slice(-limit);
  }

  public rememberFact(fact: string): void {
    if (!this.data.facts.includes(fact)) {
      this.data.facts.push(fact);
      this.save();
    }
  }

  public getFacts(): string[] {
    return [...this.data.facts];
  }

  public forgetFact(index: number): boolean {
    if (index >= 0 && index < this.data.facts.length) {
      this.data.facts.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  public clearAllMemory(): void {
    this.data.facts = [];
    this.data.conversations = [];
    this.save();
  }

  public getPreference(key: string): string | undefined {
    return this.data.preferences[key];
  }

  public setPreference(key: string, value: string): void {
    this.data.preferences[key] = value;
    this.save();
  }
}
