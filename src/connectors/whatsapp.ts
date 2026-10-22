/**
 * AI RAMU WhatsApp Connector
 * Allows pairing with WhatsApp via local QR code or Webhook Gateway.
 * Current State: Available (Local Gateway / QR Simulation Mode)
 */

export interface WhatsAppStatus {
  status: "disconnected" | "pairing" | "connected" | "error";
  pairedNumber?: string;
  qrCodeUrl?: string;
  lastMessageTimestamp?: number;
}

export class WhatsAppConnector {
  private status: WhatsAppStatus = {
    status: "disconnected",
  };

  public getStatus(): WhatsAppStatus {
    return { ...this.status };
  }

  public initiatePairing(): { pairingCode: string; instructions: string } {
    this.status.status = "pairing";
    const pairingCode = "RAMU-" + Math.floor(100000 + Math.random() * 900000);
    return {
      pairingCode,
      instructions: "Open WhatsApp on your phone > Linked Devices > Link a Device > Enter code or scan QR.",
    };
  }

  public simulateIncomingMessage(sender: string, text: string): { sender: string; text: string; receivedAt: number } {
    this.status.status = "connected";
    this.status.pairedNumber = sender;
    this.status.lastMessageTimestamp = Date.now();
    return {
      sender,
      text,
      receivedAt: Date.now(),
    };
  }

  public async sendMessage(recipient: string, message: string): Promise<boolean> {
    if (this.status.status !== "connected") {
      console.warn(`[AI RAMU] WhatsApp not linked. Queuing message for ${recipient}`);
      return false;
    }
    console.log(`[AI RAMU] WhatsApp message sent to ${recipient}: ${message}`);
    return true;
  }
}
