import { RamuConfig } from "../config.js";
import { FileSandbox } from "../security/sandbox.js";
import { FilesystemConnector } from "./filesystem.js";
import { BrowserConnector } from "./browser.js";
import { WhatsAppConnector } from "./whatsapp.js";
import { TelegramConnector } from "./telegram.js";
import { GoogleWorkspaceConnector } from "./google.js";

export class ConnectorRegistry {
  public filesystem: FilesystemConnector;
  public browser: BrowserConnector;
  public whatsapp: WhatsAppConnector;
  public telegram: TelegramConnector;
  public google: GoogleWorkspaceConnector;

  constructor(config: RamuConfig, sandbox: FileSandbox) {
    this.filesystem = new FilesystemConnector(sandbox);
    this.browser = new BrowserConnector();
    this.whatsapp = new WhatsAppConnector();
    this.telegram = new TelegramConnector(config.connectors.telegramToken);
    this.google = new GoogleWorkspaceConnector(
      config.connectors.googleClientId,
      config.connectors.googleClientSecret
    );
  }

  public getSummary() {
    return {
      filesystem: {
        name: "Local Filesystem Sandbox",
        status: "active",
        allowedRoot: this.filesystem["sandbox"].getAllowedRoot(),
      },
      browser: {
        name: "Web Browser & Scraping",
        status: "active",
      },
      whatsapp: {
        name: "WhatsApp Gateway",
        ...this.whatsapp.getStatus(),
      },
      telegram: {
        name: "Telegram Bot Gateway",
        ...this.telegram.getStatus(),
      },
      google: {
        name: "Google Workspace (Gmail / Calendar)",
        ...this.google.getStatus(),
      },
    };
  }
}
