/**
 * AI RAMU Built-in Automation Recipes
 * Indian Productivity & Business Workflows
 */

export interface WorkflowRecipe {
  id: string;
  name: string;
  category: "Business" | "Productivity" | "Organization" | "Communication";
  description: string;
  defaultSchedule?: string;
  inputs: {
    key: string;
    label: string;
    type: "text" | "number" | "select";
    defaultValue?: any;
  }[];
}

export const WORKFLOW_RECIPES: WorkflowRecipe[] = [
  {
    id: "gst_invoice_generator",
    name: "Indian GST Invoice Generator (₹ INR)",
    category: "Business",
    description: "Generates a clean, tax-compliant Indian GST invoice document (with CGST, SGST, and IGST breakdowns) in HTML & Markdown.",
    inputs: [
      { key: "clientName", label: "Client / Company Name", type: "text", defaultValue: "Sharma Enterprises" },
      { key: "gstin", label: "Client GSTIN", type: "text", defaultValue: "27AAAAA0000A1Z5" },
      { key: "itemDescription", label: "Description of Services", type: "text", defaultValue: "Software Development & Automation Consulting" },
      { key: "amount", label: "Taxable Amount (₹)", type: "number", defaultValue: 50000 },
      { key: "gstRate", label: "GST Rate (%)", type: "number", defaultValue: 18 },
    ],
  },
  {
    id: "workspace_organizer",
    name: "Workspace Directory File Organizer",
    category: "Organization",
    description: "Scans your configured workspace directory, segregates loose files by extension into Documents, Data, Images, and Archives, and generates a structured catalog.",
    inputs: [
      { key: "folderName", label: "Subfolder to Organize", type: "text", defaultValue: "." },
    ],
  },
  {
    id: "daily_briefing_digest",
    name: "Daily Work Briefing Digest",
    category: "Productivity",
    description: "Compiles a morning briefing with your pending tasks, schedule summary, and memory notes in your preferred language.",
    defaultSchedule: "Every day at 09:00 AM",
    inputs: [
      { key: "includeMemoryFacts", label: "Include Memory Notes", type: "select", defaultValue: "yes" },
    ],
  },
  {
    id: "csv_data_cruncher",
    name: "CSV Spreadsheet Quick Analyzer",
    category: "Business",
    description: "Reads any CSV spreadsheet in your workspace, extracts summary statistics (total, average, row count), and writes an executive report.",
    inputs: [
      { key: "csvFileName", label: "Target CSV File Name", type: "text", defaultValue: "sales_data.csv" },
    ],
  },
];
