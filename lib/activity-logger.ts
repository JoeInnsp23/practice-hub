import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";

/**
 * Module/Hub where activity is logged from
 */
export type ActivityModule =
  | "admin-hub"
  | "client-hub"
  | "practice-hub"
  | "proposal-hub"
  | "employee-hub"
  | "social-hub"
  | "client-portal"
  | "system";

/**
 * Log an activity to the activity_logs table
 *
 * @param params Activity log parameters
 * @param params.tenantId - Tenant ID for multi-tenant isolation
 * @param params.module - Module/hub where activity originated
 * @param params.entityType - Type of entity (task, client, invoice, etc.)
 * @param params.entityId - ID of the entity
 * @param params.action - Action performed (created, updated, deleted, etc.)
 * @param params.description - Human-readable description
 * @param params.userId - User who performed action (optional)
 * @param params.userName - User name (denormalized for performance)
 * @param params.oldValues - Previous state (for audit trail)
 * @param params.newValues - New state (for audit trail)
 * @param params.metadata - Additional context
 *
 * @example
 * ```typescript
 * await logActivity({
 *   tenantId,
 *   module: "admin-hub",
 *   entityType: "user",
 *   entityId: user.id,
 *   action: "created",
 *   description: `Added user ${user.firstName} ${user.lastName}`,
 *   userId: ctx.authContext.userId,
 *   userName: ctx.authContext.userName,
 *   newValues: { email: user.email, role: user.role },
 * });
 * ```
 */
export async function logActivity(params: {
  tenantId: string;
  module: ActivityModule;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  userId?: string | null;
  userName?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(activityLogs).values({
    tenantId: params.tenantId,
    module: params.module,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    description: params.description,
    userId: params.userId ?? null,
    userName: params.userName ?? null,
    oldValues: params.oldValues ?? null,
    newValues: params.newValues ?? null,
    metadata: params.metadata ?? null,
  });
}
