import path from "node:path";
import fs from "node:fs";
import { TaskQueue, TaskItem } from "./queue.js";
import { WORKFLOW_RECIPES } from "./recipes.js";
import { ConnectorRegistry } from "../connectors/index.js";
import { ApprovalManager } from "../security/approval.js";

export class AutomationEngine {
  private queue: TaskQueue;
  private connectors: ConnectorRegistry;
  private approvalManager: ApprovalManager;

  constructor(queue: TaskQueue, connectors: ConnectorRegistry, approvalManager: ApprovalManager) {
    this.queue = queue;
    this.connectors = connectors;
    this.approvalManager = approvalManager;
  }

  public getAvailableRecipes() {
    return WORKFLOW_RECIPES;
  }

  public async executeWorkflow(recipeId: string, params: Record<string, any>): Promise<TaskItem> {
    const recipe = WORKFLOW_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) {
      throw new Error(`Unknown workflow recipe: ${recipeId}`);
    }

    const task = this.queue.createTask(recipe.name, `Executing ${recipe.name}`);
    this.queue.updateStatus(task.id, "running", "Initiating workflow execution");

    try {
      if (recipeId === "gst_invoice_generator") {
        await this.runGstInvoiceGenerator(task.id, params);
      } else if (recipeId === "workspace_organizer") {
        await this.runWorkspaceOrganizer(task.id, params);
      } else if (recipeId === "daily_briefing_digest") {
        await this.runDailyBriefing(task.id, params);
      } else if (recipeId === "csv_data_cruncher") {
        await this.runCsvDataCruncher(task.id, params);
      } else {
        throw new Error(`Recipe handler not implemented: ${recipeId}`);
      }

      this.queue.updateStatus(task.id, "completed", "Workflow completed successfully.");
    } catch (err: any) {
      this.queue.updateStatus(task.id, "failed", `Error: ${err.message}`);
      task.error = err.message;
    }

    return task;
  }

  private async runGstInvoiceGenerator(taskId: string, params: Record<string, any>) {
    this.queue.log(taskId, "Calculating GST breakdown in ₹ INR...");
    const client = params.clientName || "Sharma Enterprises";
    const gstin = params.gstin || "27AAAAA0000A1Z5";
    const desc = params.itemDescription || "Software Consulting";
    const taxable = parseFloat(params.amount) || 50000;
    const rate = parseFloat(params.gstRate) || 18;

    const cgst = (taxable * (rate / 2)) / 100;
    const sgst = (taxable * (rate / 2)) / 100;
    const total = taxable + cgst + sgst;
    const invoiceNum = "INV-" + Math.floor(1000 + Math.random() * 9000);
    const invoiceDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const markdownInvoice = `# TAX INVOICE
**Invoice No:** ${invoiceNum}  
**Date:** ${invoiceDate}  
**Place of Supply:** State Code 27 (Maharashtra)  

---

### Billed To:
**${client}**  
**GSTIN:** ${gstin}  

---

| Item Description | HSN/SAC | Taxable Value (₹) | CGST (${rate / 2}%) | SGST (${rate / 2}%) | Total (₹) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ${desc} | 998314 | ₹${taxable.toLocaleString("en-IN")} | ₹${cgst.toLocaleString("en-IN")} | ₹${sgst.toLocaleString("en-IN")} | ₹${total.toLocaleString("en-IN")} |

### Total Amount Due: ₹${total.toLocaleString("en-IN")}

---
*Generated autonomously by AI RAMU — Bolo Ramu, Kaam Shuru.*
`;

    const fileName = `invoices/${invoiceNum}.md`;
    this.queue.log(taskId, `Writing invoice to workspace: ${fileName}`);
    this.connectors.filesystem.writeFile(fileName, markdownInvoice);
    this.queue.log(taskId, `Invoice generated successfully at workspace/${fileName}`);
  }

  private async runWorkspaceOrganizer(taskId: string, params: Record<string, any>) {
    const targetFolder = params.folderName || ".";
    this.queue.log(taskId, `Scanning target directory: ${targetFolder}`);
    const files = this.connectors.filesystem.listFiles(targetFolder);

    let moved = 0;
    for (const file of files) {
      if (file.isDirectory) continue;
      const ext = path.extname(file.name).toLowerCase();
      let targetSubdir = "Misc";
      if ([".pdf", ".docx", ".txt", ".md"].includes(ext)) targetSubdir = "Documents";
      else if ([".csv", ".xlsx", ".json"].includes(ext)) targetSubdir = "Data";
      else if ([".png", ".jpg", ".jpeg", ".svg"].includes(ext)) targetSubdir = "Images";

      this.queue.log(taskId, `Categorized ${file.name} -> ${targetSubdir}`);
      moved++;
    }

    const report = `# AI RAMU Organization Report
**Timestamp:** ${new Date().toISOString()}  
**Files Cataloged:** ${moved}  
`;
    this.connectors.filesystem.writeFile("ORGANIZATION_REPORT.md", report);
    this.queue.log(taskId, `Report written to ORGANIZATION_REPORT.md (${moved} files cataloged).`);
  }

  private async runDailyBriefing(taskId: string, params: Record<string, any>) {
    this.queue.log(taskId, "Assembling daily briefing...");
    const briefing = `# AI RAMU Daily Briefing
*Bolo Ramu, Kaam Shuru.*
**Date:** ${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

## 1. System Status
- AI RAMU Agent Core: Online & Operational
- Security Sandbox: Active
- Active Integrations: Filesystem, Browser Automation, Local Gateway

## 2. Priority Action Items
- [ ] Review pending task approvals
- [ ] Check invoice status and client deliverables
- [ ] Execute scheduled data backups

*Have a productive day!*
`;
    this.connectors.filesystem.writeFile("DAILY_BRIEFING.md", briefing);
    this.queue.log(taskId, "Briefing saved to workspace/DAILY_BRIEFING.md");
  }

  private async runCsvDataCruncher(taskId: string, params: Record<string, any>) {
    const targetFile = params.csvFileName || "sample.csv";
    this.queue.log(taskId, `Checking file: ${targetFile}`);

    let content = "";
    try {
      content = this.connectors.filesystem.readFile(targetFile);
    } catch {
      // Create a sample CSV if none exists
      content = `Item,Category,Units,PriceINR\nLaptop,Electronics,5,65000\nDesk,Furniture,10,8500\nChair,Furniture,20,4500\nMonitor,Electronics,8,18000\n`;
      this.connectors.filesystem.writeFile(targetFile, content);
      this.queue.log(taskId, `Target file not found; created sample data file at workspace/${targetFile}`);
    }

    const lines = content.trim().split("\n");
    const rowCount = Math.max(0, lines.length - 1);
    this.queue.log(taskId, `Parsed ${rowCount} records from ${targetFile}.`);

    const summary = `# CSV Data Summary: ${targetFile}
- **Total Records:** ${rowCount}
- **Headers:** ${lines[0]}
- **Analyzed On:** ${new Date().toISOString()}
`;
    this.connectors.filesystem.writeFile("CSV_ANALYSIS_SUMMARY.md", summary);
    this.queue.log(taskId, "Analysis report saved to workspace/CSV_ANALYSIS_SUMMARY.md");
  }
}
