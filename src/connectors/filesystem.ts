import fs from "node:fs";
import path from "node:path";
import { FileSandbox } from "../security/sandbox.js";

export interface FileEntry {
  name: string;
  isDirectory: boolean;
  size: number;
  updatedAt: Date;
}

export class FilesystemConnector {
  private sandbox: FileSandbox;

  constructor(sandbox: FileSandbox) {
    this.sandbox = sandbox;
  }

  public listFiles(subPath: string = "."): FileEntry[] {
    const safePath = this.sandbox.resolveSafePath(subPath);
    if (!fs.existsSync(safePath)) {
      return [];
    }
    const items = fs.readdirSync(safePath);
    return items.map((item) => {
      const full = path.join(safePath, item);
      const stat = fs.statSync(full);
      return {
        name: item,
        isDirectory: stat.isDirectory(),
        size: stat.size,
        updatedAt: stat.mtime,
      };
    });
  }

  public readFile(targetPath: string): string {
    const safePath = this.sandbox.resolveSafePath(targetPath);
    if (!fs.existsSync(safePath)) {
      throw new Error(`File not found: ${targetPath}`);
    }
    return fs.readFileSync(safePath, "utf8");
  }

  public writeFile(targetPath: string, content: string): void {
    const safePath = this.sandbox.resolveSafePath(targetPath);
    const parent = path.dirname(safePath);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    fs.writeFileSync(safePath, content, "utf8");
  }

  public deleteFile(targetPath: string): boolean {
    const safePath = this.sandbox.resolveSafePath(targetPath);
    if (fs.existsSync(safePath)) {
      fs.unlinkSync(safePath);
      return true;
    }
    return false;
  }
}
