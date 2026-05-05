/**
 * Read-only listing of saved plans for a user. Phase 6.
 */
import { getSupabaseAdmin, isSupabaseConfigured } from "./admin";

export interface SavedPlanRow {
  id: string;
  title: string;
  plan_date: string | null;
  status: string;
  ai_model: string | null;
  input_text: string | null;
  created_at: string;
  item_count: number;
}

export interface SavedPlanItemRow {
  id: string;
  plan_id: string;
  title: string;
  start_time: string;
  end_time: string;
  item_type: string;
  google_event_id: string | null;
  is_locked: boolean;
  reason: string | null;
}

export async function listPlansForUser(
  userId: string,
  limit = 50
): Promise<SavedPlanRow[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("plans")
    .select("id, title, plan_date, status, ai_model, input_text, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  // Pull counts per plan in one query.
  const ids = (data as Array<{ id: string }>).map((r) => r.id);
  if (ids.length === 0) return [];

  const { data: items } = await sb
    .from("plan_items")
    .select("plan_id")
    .in("plan_id", ids);
  const counts = new Map<string, number>();
  for (const r of (items as Array<{ plan_id: string }>) ?? []) {
    counts.set(r.plan_id, (counts.get(r.plan_id) ?? 0) + 1);
  }

  return (data as Omit<SavedPlanRow, "item_count">[]).map((row) => ({
    ...row,
    item_count: counts.get(row.id) ?? 0,
  }));
}

export async function getPlanWithItems(
  userId: string,
  planId: string
): Promise<{ plan: SavedPlanRow | null; items: SavedPlanItemRow[] }> {
  if (!isSupabaseConfigured()) return { plan: null, items: [] };
  const sb = getSupabaseAdmin();
  const { data: plan } = await sb
    .from("plans")
    .select("id, title, plan_date, status, ai_model, input_text, created_at")
    .eq("user_id", userId)
    .eq("id", planId)
    .maybeSingle();
  if (!plan) return { plan: null, items: [] };
  const { data: items } = await sb
    .from("plan_items")
    .select(
      "id, plan_id, title, start_time, end_time, item_type, google_event_id, is_locked, reason"
    )
    .eq("plan_id", planId)
    .order("start_time", { ascending: true });
  const planRow = plan as Omit<SavedPlanRow, "item_count">;
  return {
    plan: { ...planRow, item_count: items?.length ?? 0 },
    items: (items as SavedPlanItemRow[]) ?? [],
  };
}
