import { create } from "zustand";
import type { PlanItem, DayBucket, Task } from "@/lib/types";
import { MOCK_PLAN } from "@/lib/mock/plans";

interface TaskActionsState {
  open: boolean;
  item: PlanItem | null;
  mode: "status" | "actions";
}

interface TasksStore {
  buckets: DayBucket[];
  inbox: Task[];
  actionsSheet: TaskActionsState;
  searchQuery: string;

  setBuckets: (buckets: DayBucket[]) => void;
  updateItem: (id: string, patch: Partial<PlanItem>) => void;
  removeItem: (id: string) => void;
  postponeItem: (id: string) => void;
  pinItem: (id: string) => void;
  setInbox: (inbox: Task[]) => void;
  resolveInboxTask: (id: string) => void;
  openActionsSheet: (item: PlanItem, mode?: "status" | "actions") => void;
  closeActionsSheet: () => void;
  setSearchQuery: (q: string) => void;
}

export const useTasksStore = create<TasksStore>((set) => ({
  buckets: MOCK_PLAN.buckets,
  inbox: MOCK_PLAN.inbox,
  actionsSheet: { open: false, item: null, mode: "actions" },
  searchQuery: "",

  setBuckets: (buckets) => set({ buckets }),

  updateItem: (id, patch) =>
    set((s) => ({
      buckets: s.buckets.map((b) => ({
        ...b,
        items: b.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
      })),
    })),

  removeItem: (id) =>
    set((s) => ({
      buckets: s.buckets.map((b) => ({
        ...b,
        items: b.items.filter((it) => it.id !== id),
      })),
      actionsSheet: { open: false, item: null, mode: "actions" },
    })),

  postponeItem: (id) =>
    set((s) => ({
      buckets: s.buckets.map((b) => ({
        ...b,
        items: b.items.map((it) =>
          it.id === id
            ? {
                ...it,
                start_time: new Date(
                  new Date(it.start_time).getTime() + 24 * 60 * 60 * 1000
                ).toISOString(),
                end_time: new Date(
                  new Date(it.end_time).getTime() + 24 * 60 * 60 * 1000
                ).toISOString(),
                reason: "أجّلتها للغد",
              }
            : it
        ),
      })),
      actionsSheet: { open: false, item: null, mode: "actions" },
    })),

  pinItem: (id) =>
    set((s) => ({
      buckets: s.buckets.map((b) => ({
        ...b,
        items: b.items.map((it) =>
          it.id === id ? { ...it, is_locked: true } : it
        ),
      })),
      actionsSheet: { open: false, item: null, mode: "actions" },
    })),

  setInbox: (inbox) => set({ inbox }),

  resolveInboxTask: (id) =>
    set((s) => ({
      inbox: s.inbox.filter((t) => t.id !== id),
    })),

  openActionsSheet: (item, mode = "actions") =>
    set({ actionsSheet: { open: true, item, mode } }),

  closeActionsSheet: () =>
    set((s) => ({
      actionsSheet: { open: false, item: null, mode: s.actionsSheet.mode },
    })),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
