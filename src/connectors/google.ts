/**
 * AI RAMU Google Workspace Connector (Gmail & Google Calendar)
 * Uses official OAuth 2.0 flow; never requests user passwords.
 * Current State: Ready for OAuth credentials
 */

export interface GoogleConnectorStatus {
  status: "unauthorized" | "authorized" | "expired" | "not_configured";
  scopesGranted: string[];
  userEmail?: string;
}

export class GoogleWorkspaceConnector {
  private clientId?: string;
  private clientSecret?: string;
  private status: GoogleConnectorStatus = {
    status: "not_configured",
    scopesGranted: [],
  };

  constructor(clientId?: string, clientSecret?: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    if (this.clientId && this.clientSecret) {
      this.status.status = "unauthorized";
    }
  }

  public getStatus(): GoogleConnectorStatus {
    return { ...this.status };
  }

  public getOAuthUrl(redirectUri: string): string {
    if (!this.clientId) {
      throw new Error("Google Client ID is missing. Configure GOOGLE_CLIENT_ID in your settings.");
    }
    const scopes = encodeURIComponent(
      "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.events"
    );
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent`;
  }
}
