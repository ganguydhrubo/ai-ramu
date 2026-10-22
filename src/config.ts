import path from "node:path";
import os from "node:os";
import fs from "node:fs";

export interface RamuConfig {
  host: string;
  port: number;
  language: "en" | "hi" | "bn";
  workspaceDir: string;
  dataDir: string;
  activeProvider: "gemini" | "openai" | "anthropic" | "groq" | "ollama";
  apiKeys: {
    gemini?: string;
    openai?: string;
    anthropic?: string;
    groq?: string;
  };
  models: {
    gemini: string;
    openai: string;
    anthropic: string;
    groq: string;
    ollama: string;
  };
  ollamaBaseUrl: string;
  security: {
    requireApprovalForDestructive: boolean;
    allowedDirectoryRoot: string;
    enableAuditLog: boolean;
  };
  connectors: {
    whatsappEnabled: boolean;
    telegramToken?: string;
    googleClientId?: string;
    googleClientSecret?: string;
  };
}

export function loadConfig(): RamuConfig {
  const homeDir = os.homedir();
  const dataDir = process.env.RAMU_DATA_DIR || path.join(homeDir, ".ramu");
  const workspaceDir = process.env.RAMU_WORKSPACE || path.join(process.cwd(), "workspace");

  // Ensure directories exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true });
  }

  const lang = (process.env.RAMU_LANGUAGE || "en").toLowerCase();
  const validLang: "en" | "hi" | "bn" = lang === "hi" || lang === "bn" ? lang : "en";

  return {
    host: process.env.RAMU_HOST || "127.0.0.1",
    port: parseInt(process.env.RAMU_PORT || "8080", 10),
    language: validLang,
    workspaceDir,
    dataDir,
    activeProvider: (process.env.ACTIVE_PROVIDER as any) || "gemini",
    apiKeys: {
      gemini: process.env.GEMINI_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      groq: process.env.GROQ_API_KEY,
    },
    models: {
      gemini: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      openai: process.env.OPENAI_MODEL || "gpt-4o",
      anthropic: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
      groq: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      ollama: process.env.OLLAMA_MODEL || "llama3.2",
    },
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    security: {
      requireApprovalForDestructive: process.env.REQUIRE_HUMAN_APPROVAL_FOR_DESTRUCTIVE !== "false",
      allowedDirectoryRoot: path.resolve(process.env.ALLOWED_DIRECTORY_ROOT || workspaceDir),
      enableAuditLog: process.env.ENABLE_AUDIT_LOG !== "false",
    },
    connectors: {
      whatsappEnabled: process.env.WHATSAPP_ENABLED === "true",
      telegramToken: process.env.TELEGRAM_BOT_TOKEN,
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  };
}
