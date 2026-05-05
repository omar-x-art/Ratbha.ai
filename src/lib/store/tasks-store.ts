"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlanItem } from "@/lib/types";

/**
 * Local checklist store. Lives entirely in localStorage so it works
 * without Google OAuth or Supabase. Each task tracks its own `done`
 * flag separate from its scheduling info.
 */
export interface ChecklistTask {
  id: string;
  title: string;
  /** ISO timestamp when the task is intended (optional). */
  start_time?: string;
  /** ISO timestamp end (optional). */
  end_time?: string;
  /** YYYY-MM-DD bucket the task belongs to (optional). */
  date?: string;
  reason?: string;
  done: boolean;
  done_at?: string;
  source: "plan" | "manual";
  created_at: string;
}

interface TasksState {
  tasks: ChecklistTask[];
  addFromPlanItems: (items: PlanItem[]) => number;
  addManual: (title: string, date?: string) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clearDone: () => void;
  clearAll: () => void;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: [],
      addFromPlanItems: (items) => {
        let added = 0;
        set((s) => {
          const existing = new Set(s.tasks.map((t) => t.id));
          const next: ChecklistTask[] = [...s.tasks];
          for (const it of items) {
            const id = `pi-${it.id}`;
            if (existing.has(id)) continue;
            next.push({
              id,
              title: it.title,
              start_time: it.start_time,
              end_time: it.end_time,
              date: ymd(new Date(it.start_time)),
              reason: it.reason,
              done: false,
              source: "plan",
              created_at: new Date().toISOString(),
            });
            added++;
          }
          return { tasks: next };
        });
        return added;
      },
      addManual: (title, date) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              title,
              date,
              done: false,
              source: "manual",
              created_at: new Date().toISOString(),
            },
          ],
        })),
      toggle: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  done: !t.done,
                  done_at: !t.done ? new Date().toISOString() : undefined,
                }
              : t
          ),
        })),
      remove: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      clearDone: () =>
        set((s) => ({ tasks: s.tasks.filter((t) => !t.done) })),
      clearAll: () => set({ tasks: [] }),
    }),
    {
      name: "rattabha-tasks",
      version: 1,
    }
  )
);
