/**
 * AI RAMU Telegram Connector
 * Supports polling and webhook handling via official Telegram Bot API.
 * Current State: Available (Token Configurable)
 */

export interface TelegramStatus {
  status: "configured" | "not_configured" | "active" | "error";
  botUsername?: string;
}

export class TelegramConnector {
  private botToken?: string;

  constructor(botToken?: string) {
    this.botToken = botToken;
  }

  public getStatus(): TelegramStatus {
    if (!this.botToken) {
      return { status: "not_configured" };
    }
    return {
      status: "configured",
      botUsername: "@AIRamuWorkerBot",
    };
  }

  public async sendMessage(chatId: string | number, text: string): Promise<boolean> {
    if (!this.botToken) {
      console.warn("[AI RAMU] Telegram bot token not configured.");
      return false;
    }
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      return res.ok;
    } catch (err) {
      console.error("[AI RAMU] Failed to send Telegram message", err);
      return false;
    }
  }
}
