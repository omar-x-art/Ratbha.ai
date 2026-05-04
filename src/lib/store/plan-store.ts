"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Plan, PlanItem, DayBucket } from "@/lib/types";

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
  setInputText: (t: string) => void;
  reset: () => void;
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
      reset: () => set({ plan: null, inputText: "", loading: false }),
    }),
    {
      name: "rattabha-plan",
      // Only persist the plan + last input; loading is transient.
      partialize: (s) => ({ plan: s.plan, inputText: s.inputText }),
    }
  )
);
