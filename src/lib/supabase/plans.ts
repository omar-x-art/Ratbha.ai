/**
 * Plan persistence. Phase 5.
 *
 * Saves a `Plan` to Supabase as one `plans` row + N `plan_items`. Errors
 * are caught and returned to the caller; the upstream API decides how to
 * surface them. We never block the user's primary save-to-Calendar flow on
 * a Supabase failure.
 */
import { getSupabaseAdmin, isSupabaseConfigured } from "./admin";
import type { Plan, PlanItem } from "@/lib/types";

export interface SavedPlanReference {
  plan_id: string;
  item_count: number;
}

export async function persistPlan(args: {
  userId: string;
  plan: Plan;
  inputText?: string;
  aiModel?: string;
}): Promise<SavedPlanReference | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabaseAdmin();

  const planDate = firstBucketDate(args.plan);

  const { data: planRow, error: planErr } = await sb
    .from("plans")
    .insert({
      user_id: args.userId,
      title: args.plan.title,
      plan_date: planDate,
      status: args.plan.status,
      ai_model: args.aiModel ?? args.plan.ai_model ?? null,
      input_text: args.inputText ?? args.plan.input_text ?? null,
    })
    .select("id")
    .single();

  if (planErr || !planRow) return null;
  const planId = (planRow as { id: string }).id;

  const items = args.plan.buckets.flatMap((b) => b.items);
  if (items.length === 0) {
    return { plan_id: planId, item_count: 0 };
  }

  const rows = items.map((it) => itemToRow(planId, it));
  const { error: itemErr } = await sb.from("plan_items").insert(rows);
  if (itemErr) {
    return { plan_id: planId, item_count: 0 };
  }
  return { plan_id: planId, item_count: rows.length };
}

function itemToRow(planId: string, it: PlanItem) {
  return {
    plan_id: planId,
    title: it.title,
    start_time: it.start_time,
    end_time: it.end_time,
    item_type: it.item_type,
    google_event_id: it.google_event_id ?? null,
    is_locked: it.is_locked ?? false,
    reason: it.reason ?? null,
  };
}

function firstBucketDate(plan: Plan): string | null {
  for (const b of plan.buckets) {
    if (b.date) return b.date;
  }
  return null;
}
