import { randomUUID } from "node:crypto";

export type TaskStatus = "pending" | "running" | "awaiting_approval" | "completed" | "failed" | "cancelled";

export interface TaskItem {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  logs: string[];
  error?: string;
  result?: any;
}

export class TaskQueue {
  private tasks: Map<string, TaskItem> = new Map();

  public createTask(name: string, description: string): TaskItem {
    const id = "task_" + randomUUID().substring(0, 8);
    const task: TaskItem = {
      id,
      name,
      description,
      status: "pending",
      createdAt: Date.now(),
      logs: [`[${new Date().toLocaleTimeString()}] Task queued: ${name}`],
    };
    this.tasks.set(id, task);
    return task;
  }

  public getTask(id: string): TaskItem | undefined {
    return this.tasks.get(id);
  }

  public getAllTasks(): TaskItem[] {
    return Array.from(this.tasks.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public updateStatus(id: string, status: TaskStatus, logMessage?: string): void {
    const task = this.tasks.get(id);
    if (!task) return;
    task.status = status;
    if (status === "running" && !task.startedAt) {
      task.startedAt = Date.now();
    }
    if (status === "completed" || status === "failed" || status === "cancelled") {
      task.completedAt = Date.now();
    }
    if (logMessage) {
      task.logs.push(`[${new Date().toLocaleTimeString()}] ${logMessage}`);
    }
  }

  public log(id: string, message: string): void {
    const task = this.tasks.get(id);
    if (task) {
      task.logs.push(`[${new Date().toLocaleTimeString()}] ${message}`);
    }
  }

  public cancel(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task || task.status === "completed" || task.status === "failed") {
      return false;
    }
    task.status = "cancelled";
    task.logs.push(`[${new Date().toLocaleTimeString()}] Task cancelled by user.`);
    return true;
  }
}
