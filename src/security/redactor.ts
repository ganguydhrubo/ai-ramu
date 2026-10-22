/**
 * AI RAMU Secret & Credential Redactor
 * Masks API keys, passwords, bearer tokens, and secrets from logs and terminal outputs.
 */

export class SecretRedactor {
  private static SECRET_REGEXES: RegExp[] = [
    // Generic API keys (e.g. sk-..., AIzaSy...)
    /(?:api[_-]?key|bearer|token|secret|password|access_token)[\s:=]+["']?([a-zA-Z0-9_\-\.]{16,})["']?/gi,
    /sk-[a-zA-Z0-9]{20,}/g,
    /ghp_[a-zA-Z0-9]{30,}/g,
    /AIzaSy[a-zA-Z0-9_\-]{33}/g,
  ];

  public static redact(text: string): string {
    let sanitized = text;
    for (const regex of this.SECRET_REGEXES) {
      sanitized = sanitized.replace(regex, (match, p1) => {
        if (p1) {
          const masked = p1.substring(0, 4) + "••••••••" + p1.substring(Math.max(0, p1.length - 4));
          return match.replace(p1, masked);
        }
        return match.substring(0, 4) + "••••••••" + match.substring(Math.max(0, match.length - 4));
      });
    }
    return sanitized;
  }
}
