import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import { FileSandbox } from "../dist/security/sandbox.js";
import { ConnectorRegistry } from "../dist/connectors/index.js";
import { TaskQueue } from "../dist/automation/queue.js";
import { ApprovalManager } from "../dist/security/approval.js";
import { AutomationEngine } from "../dist/automation/engine.js";

test("TaskQueue transitions statuses correctly", () => {
  const queue = new TaskQueue();
  const task = queue.createTask("Test Automation", "Running test task");

  assert.equal(task.status, "pending");
  queue.updateStatus(task.id, "running", "Task started");
  assert.equal(task.status, "running");
  queue.updateStatus(task.id, "completed", "Task finished");
  assert.equal(task.status, "completed");
});

test("AutomationEngine executes GST Invoice recipe and writes invoice file", async () => {
  const tmpRoot = path.join(os.tmpdir(), "ramu_test_auto_" + Date.now());
  const sandbox = new FileSandbox(tmpRoot);
  const queue = new TaskQueue();
  const approval = new ApprovalManager(false);
  const connectors = new ConnectorRegistry(
    {
      host: "127.0.0.1",
      port: 8080,
      language: "en",
      workspaceDir: tmpRoot,
      dataDir: tmpRoot,
      activeProvider: "gemini",
      apiKeys: {},
      models: { gemini: "gemini-2.5-flash", openai: "gpt-4o", anthropic: "claude-3-5-sonnet", groq: "llama-3.3-70b-versatile", ollama: "llama3.2" },
      ollamaBaseUrl: "",
      security: { requireApprovalForDestructive: false, allowedDirectoryRoot: tmpRoot, enableAuditLog: true },
      connectors: { whatsappEnabled: false },
    },
    sandbox
  );

  const engine = new AutomationEngine(queue, connectors, approval);

  const task = await engine.executeWorkflow("gst_invoice_generator", {
    clientName: "Patel Logistics",
    gstin: "24AAAAA0000A1Z5",
    itemDescription: "Supply Chain AI Automation",
    amount: 100000,
    gstRate: 18,
  });

  assert.equal(task.status, "completed");

  const files = connectors.filesystem.listFiles("invoices");
  assert.ok(files.length > 0, "Expected generated invoice file in invoices/");

  const invoiceContent = connectors.filesystem.readFile(path.join("invoices", files[0].name));
  assert.ok(invoiceContent.includes("Patel Logistics"));
  assert.ok(invoiceContent.includes("1,00,000") || invoiceContent.includes("100,000"));
  assert.ok(invoiceContent.includes("CGST (9%)"));
});
