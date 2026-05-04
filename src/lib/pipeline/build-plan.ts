/**
 * Pipeline: free Arabic text → extraction → resolved dates → schedule → Plan.
 *
 * Stages:
 *  1. extractTasks (Gemini or local fallback)
 *  2. resolveArabicDate on each item's date_expression
 *  3. computeFreeSlots from `BusyBlock[]` (calendar events)
 *  4. scheduleTasks on the unresolved items
 *  5. Build a `Plan` with `today / tomorrow / later / needs_clarification` buckets
 */
import { resolveArabicDate } from "@/lib/date/arabic-date-resolver";
import {
  scheduleTasks,
  type BusyBlock,
  type TaskRequest,
} from "@/lib/schedule/scheduling-engine";
import { extractTasks } from "@/lib/gemini/provider";
import type {
  DayBucket,
  Plan,
  PlanItem,
  Task,
} from "@/lib/types";
import type { TaskExtraction } from "@/lib/gemini/schema";

export interface BuildPlanOptions {
  text: string;
  busy?: BusyBlock[];
  now?: Date;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function arabicLabelFor(date: Date, now: Date): string {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );
  if (diff <= 0) return "اليوم";
  if (diff === 1) return "غداً";
  if (diff === 2) return "بعد غداً";
  return new Intl.DateTimeFormat("ar-EG", { weekday: "long" }).format(date);
}

function bucketKey(label: string): "today" | "tomorrow" | "later" {
  if (label === "اليوم") return "today";
  if (label === "غداً") return "tomorrow";
  return "later";
}

export async function buildPlan({
  text,
  busy = [],
  now = new Date(),
}: BuildPlanOptions): Promise<Plan> {
  const extraction = await extractTasks({ text });
  return buildPlanFromExtraction(extraction, { busy, now, text });
}

export function buildPlanFromExtraction(
  extraction: TaskExtraction,
  ctx: { busy?: BusyBlock[]; now?: Date; text?: string }
): Plan {
  const now = ctx.now ?? new Date();
  const busy: BusyBlock[] = [...(ctx.busy ?? [])];

  // Fixed events go straight onto the calendar slots and into a bucket.
  const fixedItems: PlanItem[] = [];
  for (const f of extraction.fixed_events_mentioned) {
    const r = resolveArabicDate(f.date_expression ?? "اليوم", now);
    const day = r.date ?? new Date(now);
    const hourMatch = f.time_expression?.match(/(\d{1,2})/);
    const h = hourMatch ? Math.max(8, Math.min(22, Number(hourMatch[1]) + (Number(hourMatch[1]) < 8 ? 12 : 0))) : 14;
    const start = new Date(day);
    start.setHours(h, 0, 0, 0);
    const end = new Date(start.getTime() + (f.duration_minutes ?? 60) * 60_000);
    fixedItems.push({
      id: `fix-${fixedItems.length + 1}`,
      title: f.title,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      item_type: "existing_event",
      is_locked: true,
      reason: "ذكرته كموعد محدّد",
    });
    busy.push({ start: start.getTime(), end: end.getTime(), isMeeting: true });
  }

  // Resolve dates for flexible tasks; ambiguous → inbox.
  const inbox: Task[] = [];
  const dayRequests: Map<string, TaskRequest[]> = new Map();
  let counter = 1;

  for (const t of extraction.tasks) {
    const id = `t-${counter++}`;
    const resolved = t.date_expression
      ? resolveArabicDate(t.date_expression, now)
      : { date: null, confidence: 0, reason: "no_date" };

    if (!resolved.date || resolved.confidence < 0.5) {
      inbox.push({
        id,
        title: t.title,
        status: "inbox",
        source_text: ctx.text,
        duration_minutes: t.duration_minutes,
        priority: t.priority,
        energy: t.energy,
        flexibility: t.flexibility,
        reason: t.date_expression
          ? `قلت «${t.date_expression}» — متى يناسبك؟`
          : "لم أحدد لها يوماً، متى تفضّل؟",
      });
      continue;
    }

    const dayStart = new Date(resolved.date);
    dayStart.setHours(0, 0, 0, 0);
    const key = ymd(dayStart);
    if (!dayRequests.has(key)) dayRequests.set(key, []);
    dayRequests.get(key)!.push({
      id,
      title: t.title,
      duration_minutes: t.duration_minutes,
      priority: t.priority,
      energy: t.energy,
      flexibility: t.flexibility,
    });
  }

  // Schedule each day independently.
  const scheduledByDay: Map<string, PlanItem[]> = new Map();
  for (const [key, requests] of Array.from(dayRequests)) {
    const dayStart = new Date(`${key}T00:00:00`);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayBusy = busy.filter(
      (b) => b.end > dayStart.getTime() && b.start < dayEnd.getTime()
    );

    const out = scheduleTasks(
      requests,
      dayBusy,
      dayStart.getTime(),
      dayEnd.getTime()
    );

    const items = out.scheduled.map<PlanItem>((s) => ({
      id: `pi-${s.id}`,
      task_id: s.id,
      title: s.title,
      start_time: new Date(s.start).toISOString(),
      end_time: new Date(s.end).toISOString(),
      item_type: "proposed_task",
      reason: s.reason,
    }));
    scheduledByDay.set(key, items);

    // Anything that didn't fit goes to the inbox.
    for (const u of out.unscheduled) {
      inbox.push({
        id: u.id,
        title: u.title,
        status: "inbox",
        duration_minutes: u.duration_minutes,
        priority: u.priority ?? "medium",
        energy: u.energy ?? "medium",
        flexibility: u.flexibility ?? "flexible",
        reason: "اليوم ممتلئ — اقترح يوماً آخر؟",
      });
    }
  }

  // Build buckets: today / tomorrow / later (per-day).
  const buckets: DayBucket[] = [];
  const allKeys = new Set<string>([
    ...Array.from(scheduledByDay.keys()),
    ...fixedItems.map((f) => ymd(new Date(f.start_time))),
  ]);
  const sortedKeys = Array.from(allKeys).sort();
  for (const key of sortedKeys) {
    const dayDate = new Date(`${key}T00:00:00`);
    const items = [
      ...fixedItems.filter((f) => ymd(new Date(f.start_time)) === key),
      ...(scheduledByDay.get(key) ?? []),
    ].sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    const arabicLabel = arabicLabelFor(dayDate, now);
    buckets.push({
      date: key,
      label: bucketKey(arabicLabel),
      arabicLabel,
      items,
    });
  }

  return {
    id: `plan-${Date.now()}`,
    title: "خطتك المقترحة",
    status: "draft",
    ai_model: process.env.GEMINI_API_KEY ? "gemini-2.0-flash" : "local",
    input_text: ctx.text,
    buckets,
    inbox,
  };
}
