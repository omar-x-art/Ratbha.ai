"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Plan, PlanItem, DayBucket, Task } from "@/lib/types";

interface PlanState {
  inputText: string;
  loading: boolean;
  plan: Plan | null;
  setLoading: (v: boolean) => void;
  setPlan: (p: Plan) => void;
  updateItem: (id: string, patch: Partial<PlanItem>) => void;
  removeItem: (id: string) => void;
  postponeItem: (id: string) => void;
  pinItem: (id: string) => void;
  assignInboxTask: (taskId: string, daysFromToday: number) => void;
  setInputText: (t: string) => void;
  reset: () => void;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function arabicLabelFor(date: Date, now: Date): string {
  const t = new Date(now);
  t.setHours(0, 0, 0, 0);
  const x = new Date(date);
  x.setHours(0, 0, 0, 0);
  const diff = Math.round((x.getTime() - t.getTime()) / 86_400_000);
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

function firstFreeStart(items: PlanItem[], dayStart: Date): Date {
  // Find a 09:00+ slot that doesn't overlap.
  const candidates: Date[] = [];
  for (let h = 9; h <= 20; h++) {
    const c = new Date(dayStart);
    c.setHours(h, 0, 0, 0);
    candidates.push(c);
  }
  for (const c of candidates) {
    const cEnd = new Date(c.getTime() + 30 * 60_000);
    const overlaps = items.some((it) => {
      const s = new Date(it.start_time).getTime();
      const e = new Date(it.end_time).getTime();
      return s < cEnd.getTime() && e > c.getTime();
    });
    if (!overlaps) return c;
  }
  // Default 09:00 if everything is busy.
  const fallback = new Date(dayStart);
  fallback.setHours(9, 0, 0, 0);
  return fallback;
}

function insertOrCreateBucket(
  buckets: DayBucket[],
  date: Date,
  item: PlanItem,
  now: Date
): DayBucket[] {
  const key = ymd(date);
  const existingIdx = buckets.findIndex((b) => b.date === key);
  if (existingIdx >= 0) {
    const updated = { ...buckets[existingIdx] };
    updated.items = [...updated.items, item].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    const next = [...buckets];
    next[existingIdx] = updated;
    return next;
  }
  const arabicLabel = arabicLabelFor(date, now);
  const newBucket: DayBucket = {
    date: key,
    label: bucketKey(arabicLabel),
    arabicLabel,
    items: [item],
  };
  return [...buckets, newBucket].sort((a, b) => a.date.localeCompare(b.date));
}

function patchBuckets(
  buckets: DayBucket[],
  fn: (items: PlanItem[]) => PlanItem[]
): DayBucket[] {
  return buckets.map((b) => ({ ...b, items: fn(b.items) }));
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      inputText: "",
      loading: false,
      plan: null,
      setLoading: (v) => set({ loading: v }),
      setPlan: (plan) => set({ plan, loading: false }),
      setInputText: (inputText) => set({ inputText }),
      updateItem: (id, patch) =>
        set((s) =>
          s.plan
            ? {
                plan: {
                  ...s.plan,
                  buckets: patchBuckets(s.plan.buckets, (items) =>
                    items.map((it) => (it.id === id ? { ...it, ...patch } : it))
                  ),
                },
              }
            : s
        ),
      removeItem: (id) =>
        set((s) =>
          s.plan
            ? {
                plan: {
                  ...s.plan,
                  buckets: patchBuckets(s.plan.buckets, (items) =>
                    items.filter((it) => it.id !== id)
                  ),
                },
              }
            : s
        ),
      postponeItem: (id) =>
        set((s) =>
          s.plan
            ? {
                plan: {
                  ...s.plan,
                  buckets: patchBuckets(s.plan.buckets, (items) =>
                    items.map((it) =>
                      it.id === id
                        ? {
                            ...it,
                            start_time: new Date(
                              new Date(it.start_time).getTime() +
                                24 * 60 * 60 * 1000
                            ).toISOString(),
                            end_time: new Date(
                              new Date(it.end_time).getTime() +
                                24 * 60 * 60 * 1000
                            ).toISOString(),
                            reason: "أجّلتها للغد",
                          }
                        : it
                    )
                  ),
                },
              }
            : s
        ),
      pinItem: (id) =>
        set((s) =>
          s.plan
            ? {
                plan: {
                  ...s.plan,
                  buckets: patchBuckets(s.plan.buckets, (items) =>
                    items.map((it) =>
                      it.id === id ? { ...it, is_locked: true } : it
                    )
                  ),
                },
              }
            : s
        ),
      assignInboxTask: (taskId, daysFromToday) =>
        set((s) => {
          if (!s.plan) return s;
          const task = s.plan.inbox.find((t: Task) => t.id === taskId);
          if (!task) return s;
          const now = new Date();
          const targetDay = new Date(now);
          targetDay.setHours(0, 0, 0, 0);
          targetDay.setDate(targetDay.getDate() + daysFromToday);
          const existing = s.plan.buckets.find((b) => b.date === ymd(targetDay));
          const start = firstFreeStart(existing?.items ?? [], targetDay);
          const end = new Date(start.getTime() + (task.duration_minutes ?? 30) * 60_000);
          const item: PlanItem = {
            id: `pi-from-inbox-${task.id}`,
            task_id: task.id,
            title: task.title,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            item_type: "proposed_task",
            reason: "اخترت لها هذا اليوم",
          };
          const buckets = insertOrCreateBucket(s.plan.buckets, targetDay, item, now);
          return {
            plan: {
              ...s.plan,
              buckets,
              inbox: s.plan.inbox.filter((t: Task) => t.id !== taskId),
            },
          };
        }),
      reset: () => set({ plan: null, inputText: "", loading: false }),
    }),
    {
      name: "rattabha-plan",
      // Only persist the plan + last input; loading is transient.
      partialize: (s) => ({ plan: s.plan, inputText: s.inputText }),
    }
  )
);
