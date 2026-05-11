import { create } from "zustand";
import type { PlanItem, DayBucket, Task } from "@/lib/types";
import { MOCK_PLAN } from "@/lib/mock/plans";
import type { PillStatus } from "@/components/plan/StatusPill";

interface TasksStore {
  buckets: DayBucket[];
  inbox: Task[];
  searchQuery: string;
  itemStatuses: Record<string, PillStatus>;

  updateItem: (id: string, patch: Partial<PlanItem>) => void;
  removeItem: (id: string) => void;
  postponeItem: (id: string) => void;
  pinItem: (id: string) => void;
  markDone: (id: string) => void;
  setItemStatus: (id: string, status: PillStatus) => void;
  setInbox: (inbox: Task[]) => void;
  resolveInboxTask: (id: string) => void;
  setSearchQuery: (q: string) => void;
  reset: () => void;
}

const initialState = {
  buckets: MOCK_PLAN.buckets as DayBucket[],
  inbox: MOCK_PLAN.inbox as Task[],
  searchQuery: "",
  itemStatuses: {} as Record<string, PillStatus>,
};

export const useTasksStore = create<TasksStore>((set) => ({
  ...initialState,

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
    })),

  pinItem: (id) =>
    set((s) => ({
      buckets: s.buckets.map((b) => ({
        ...b,
        items: b.items.map((it) =>
          it.id === id ? { ...it, is_locked: true } : it
        ),
      })),
    })),

  markDone: (id) =>
    set((s) => ({
      itemStatuses: { ...s.itemStatuses, [id]: "done" },
    })),

  setItemStatus: (id, status) =>
    set((s) => ({
      itemStatuses: { ...s.itemStatuses, [id]: status },
    })),

  setInbox: (inbox) => set({ inbox }),

  resolveInboxTask: (id) =>
    set((s) => ({
      inbox: s.inbox.filter((t) => t.id !== id),
    })),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  reset: () => set(initialState),
}));
