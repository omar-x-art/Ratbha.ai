/**
 * Append-only audit log. Phase 5.
 *
 * Used to record significant user actions (calendar saves, plan reschedules,
 * destructive operations) for troubleshooting and aggregate analytics.
 *
 * Failures are intentionally swallowed — telemetry must never break the user
 * flow.
 */
import { getSupabaseAdmin, isSupabaseConfigured } from "./admin";

export type AuditAction =
  | "google_login"
  | "google_logout"
  | "calendar_save"
  | "calendar_save_partial"
  | "plan_persist"
  | "plan_reset";

export async function auditLog(args: {
  userId: string;
  action: AuditAction;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const sb = getSupabaseAdmin();
    await sb.from("audit_logs").insert({
      user_id: args.userId,
      action: args.action,
      metadata: args.metadata ?? {},
    });
  } catch {
    // Swallow telemetry errors.
  }
}
