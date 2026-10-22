import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RamuAgent } from "../core/agent.js";
import { BRAND } from "../brand.js";
import { getTranslation, SupportedLanguage } from "../core/i18n.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class RamuGateway {
  private agent: RamuAgent;
  private server?: http.Server;
  private staticDir: string;

  constructor(agent: RamuAgent) {
    this.agent = agent;
    // In TS dev: src/server/static, in compiled dist: dist/server/static (or fallback)
    const localStatic = path.join(__dirname, "static");
    const srcStatic = path.join(process.cwd(), "src", "server", "static");
    this.staticDir = fs.existsSync(localStatic) ? localStatic : srcStatic;
  }

  public start(): Promise<number> {
    return new Promise((resolve, reject) => {
      const port = this.agent.config.port;
      const host = this.agent.config.host;

      this.server = http.createServer(async (req, res) => {
        try {
          await this.handleRequest(req, res);
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      this.server.listen(port, host, () => {
        console.log(`[AI RAMU] Control Gateway running at http://${host}:${port}`);
        resolve(port);
      });

      this.server.on("error", (err) => reject(err));
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method || "GET";

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // API Routes
    if (pathname.startsWith("/api/")) {
      await this.handleApi(pathname, method, req, res);
      return;
    }

    // Static Assets
    this.serveStatic(pathname, res);
  }

  private async handleApi(pathname: string, method: string, req: http.IncomingMessage, res: http.ServerResponse) {
    res.setHeader("Content-Type", "application/json");

    // 1. GET /api/status
    if (pathname === "/api/status" && method === "GET") {
      const lang = this.agent.config.language;
      const payload = {
        brand: BRAND.name,
        tagline: BRAND.tagline,
        version: BRAND.version,
        language: lang,
        i18n: getTranslation(lang),
        activeProvider: this.agent.config.activeProvider,
        activeModel: (this.agent.config.models as any)[this.agent.config.activeProvider] || "standard",
        workspaceRoot: this.agent.sandbox.getAllowedRoot(),
        pendingApprovals: this.agent.approvalManager.listPending().length,
        connectors: this.agent.connectors.getSummary(),
      };
      res.writeHead(200);
      res.end(JSON.stringify(payload));
      return;
    }

    // 2. POST /api/chat
    if (pathname === "/api/chat" && method === "POST") {
      const body = await this.readJsonBody(req);
      const text = body.message || "";
      const lang = body.language as SupportedLanguage | undefined;
      const result = await this.agent.processInput(text, lang);
      res.writeHead(200);
      res.end(JSON.stringify(result));
      return;
    }

    // 3. GET /api/tasks
    if (pathname === "/api/tasks" && method === "GET") {
      res.writeHead(200);
      res.end(JSON.stringify({ tasks: this.agent.queue.getAllTasks() }));
      return;
    }

    // 4. POST /api/tasks/cancel
    if (pathname === "/api/tasks/cancel" && method === "POST") {
      const body = await this.readJsonBody(req);
      const success = this.agent.queue.cancel(body.taskId);
      res.writeHead(200);
      res.end(JSON.stringify({ success }));
      return;
    }

    // 5. GET /api/recipes
    if (pathname === "/api/recipes" && method === "GET") {
      res.writeHead(200);
      res.end(JSON.stringify({ recipes: this.agent.automation.getAvailableRecipes() }));
      return;
    }

    // 6. POST /api/recipes/execute
    if (pathname === "/api/recipes/execute" && method === "POST") {
      const body = await this.readJsonBody(req);
      const task = await this.agent.automation.executeWorkflow(body.recipeId, body.params || {});
      res.writeHead(200);
      res.end(JSON.stringify({ task }));
      return;
    }

    // 7. GET /api/memory
    if (pathname === "/api/memory" && method === "GET") {
      res.writeHead(200);
      res.end(
        JSON.stringify({
          facts: this.agent.memory.getFacts(),
          recentMessages: this.agent.memory.getRecentMessages(30),
        })
      );
      return;
    }

    // 8. POST /api/memory/clear
    if (pathname === "/api/memory/clear" && method === "POST") {
      this.agent.memory.clearAllMemory();
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, message: "Memory cleared." }));
      return;
    }

    // 9. GET /api/approvals
    if (pathname === "/api/approvals" && method === "GET") {
      res.writeHead(200);
      res.end(JSON.stringify({ approvals: this.agent.approvalManager.listPending() }));
      return;
    }

    // 10. POST /api/approvals/decide
    if (pathname === "/api/approvals/decide" && method === "POST") {
      const body = await this.readJsonBody(req);
      const ok = this.agent.approvalManager.decide(body.id, body.decision);
      res.writeHead(200);
      res.end(JSON.stringify({ success: ok }));
      return;
    }

    // 11. POST /api/config
    if (pathname === "/api/config" && method === "POST") {
      const body = await this.readJsonBody(req);
      if (body.language) {
        this.agent.config.language = body.language;
      }
      if (body.provider) {
        this.agent.config.activeProvider = body.provider;
      }
      if (body.apiKey) {
        (this.agent.config.apiKeys as any)[body.provider] = body.apiKey;
      }
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, config: { language: this.agent.config.language, provider: this.agent.config.activeProvider } }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Endpoint not found" }));
  }

  private serveStatic(pathname: string, res: http.ServerResponse): void {
    let filePath = path.join(this.staticDir, pathname === "/" ? "index.html" : pathname);
    
    if (!fs.existsSync(filePath)) {
      filePath = path.join(this.staticDir, "index.html");
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".ico": "image/x-icon",
    };

    const contentType = mimeTypes[ext] || "text/plain";
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
        return;
      }
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    });
  }

  private readJsonBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
      req.on("error", (err) => reject(err));
    });
  }
}
