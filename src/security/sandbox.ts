import path from "node:path";
import fs from "node:fs";

export class SandboxSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SandboxSecurityError";
  }
}

export class FileSandbox {
  private allowedRoot: string;

  constructor(allowedRoot: string) {
    this.allowedRoot = path.resolve(allowedRoot);
    if (!fs.existsSync(this.allowedRoot)) {
      fs.mkdirSync(this.allowedRoot, { recursive: true });
    }
  }

  /**
   * Validate that a target path remains strictly within the allowed workspace boundary.
   */
  public resolveSafePath(userPath: string): string {
    const resolved = path.resolve(this.allowedRoot, userPath);
    const relative = path.relative(this.allowedRoot, resolved);

    // If relative path starts with '..' or is absolute root mismatch, reject
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new SandboxSecurityError(
        `Path traversal denied. Target "${userPath}" escapes the allowed workspace "${this.allowedRoot}".`
      );
    }
    return resolved;
  }

  public getAllowedRoot(): string {
    return this.allowedRoot;
  }
}
