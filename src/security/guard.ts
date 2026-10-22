/**
 * AI RAMU Security & Command Guard
 * Filters dangerous shell commands and protects against prompt injection attacks.
 */

export class SecurityGuard {
  // Disallowed dangerous command patterns
  private static DANGEROUS_PATTERNS: RegExp[] = [
    /\b(rm\s+-rf\s+[/~]|del\s+.*[a-z]:\\?|format\s+[a-z]:)/i,
    /\b(mkfs|diskpart|shutdown|reboot|init\s+0)\b/i,
    /\b(curl|wget)\s+.*\|\s*(bash|sh|iex|powershell)/i,
    /\b(chmod\s+-R\s+777\s+\/|chown\s+-R.*\/)/i,
    /:(){ :\|:& };:/, // Fork bomb
    /reg\s+delete\s+hklm/i,
  ];

  // Prompt injection heuristic patterns
  private static INJECTION_PATTERNS: RegExp[] = [
    /ignore\s+(all\s+)?(previous|above)\s+instructions/i,
    /you\s+are\s+now\s+in\s+developer\s+mode/i,
    /jailbreak|dan\s+mode/i,
    /system\s*override\s*:\s*disable\s*security/i,
  ];

  /**
   * Check if a command contains malicious or catastrophic patterns.
   */
  public static validateCommand(cmd: string): { allowed: boolean; reason?: string } {
    const trimmed = cmd.trim();
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          allowed: false,
          reason: `Dangerous system command pattern detected: matched "${pattern.source}"`
        };
      }
    }
    return { allowed: true };
  }

  /**
   * Scan untrusted input for prompt injection attempts.
   */
  public static scanForPromptInjection(text: string): { safe: boolean; detectedThreat?: string } {
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        return {
          safe: false,
          detectedThreat: `Potential prompt injection signature detected: "${pattern.source}"`
        };
      }
    }
    return { safe: true };
  }
}
