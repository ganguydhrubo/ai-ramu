import { randomUUID } from "node:crypto";

export interface PendingAction {
  id: string;
  type: "file_write" | "file_delete" | "execute_command" | "send_message" | "network_request";
  description: string;
  payload: any;
  createdAt: number;
  status: "pending" | "approved" | "rejected";
}

export class ApprovalManager {
  private pending: Map<string, PendingAction> = new Map();
  private requireApproval: boolean;

  constructor(requireApproval: boolean = true) {
    this.requireApproval = requireApproval;
  }

  public setRequireApproval(val: boolean): void {
    this.requireApproval = val;
  }

  public requestApproval(
    type: PendingAction["type"],
    description: string,
    payload: any
  ): { needsApproval: boolean; actionId?: string } {
    if (!this.requireApproval) {
      return { needsApproval: false };
    }

    const id = randomUUID();
    const action: PendingAction = {
      id,
      type,
      description,
      payload,
      createdAt: Date.now(),
      status: "pending",
    };

    this.pending.set(id, action);
    return { needsApproval: true, actionId: id };
  }

  public getPendingAction(id: string): PendingAction | undefined {
    return this.pending.get(id);
  }

  public listPending(): PendingAction[] {
    return Array.from(this.pending.values()).filter((a) => a.status === "pending");
  }

  public decide(id: string, decision: "approved" | "rejected"): boolean {
    const action = this.pending.get(id);
    if (!action || action.status !== "pending") {
      return false;
    }
    action.status = decision;
    return true;
  }
}
