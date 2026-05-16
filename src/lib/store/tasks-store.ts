import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import type { PlanItem, DayBucket, Task, PillStatus, Plan } from "@/lib/types";
import { MOCK_PLAN } from "@/lib/mock/plans";

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
  addQuickItem: (title: string) => void;
  setPlan: (plan: Pick<Plan, "buckets" | "inbox">) => void;
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

const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

function getTasksStorage() {
  if (typeof window === "undefined") return memoryStorage;
  return localStorage;
}

function toDateKey(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function createQuickItem(title: string): PlanItem {
  const start = new Date();
  const roundedMinutes = Math.ceil(start.getMinutes() / 30) * 30;
  start.setMinutes(roundedMinutes, 0, 0);
  start.setTime(start.getTime() + 30 * 60 * 1000);

  const end = new Date(start.getTime() + 30 * 60 * 1000);

  return {
    id: `quick-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    item_type: "proposed_task",
    reason: "أضيفت من سراج",
  };
}

export const useTasksStore = create<TasksStore>()(
  persist(
    (set) => ({
      ...initialState,

      updateItem: (id, patch) =>
        set((s) => ({
          buckets: s.buckets.map((b) => ({
            ...b,
            items: b.items.map((it) =>
              it.id === id ? { ...it, ...patch } : it
            ),
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

      addQuickItem: (title) =>
        set((s) => {
          const item = createQuickItem(title);
          const hasTodayBucket = s.buckets.some((b) => b.label === "today");

          if (!hasTodayBucket) {
            return {
              buckets: [
                {
                  date: toDateKey(new Date()),
                  label: "today",
                  arabicLabel: "اليوم",
                  items: [item],
                },
                ...s.buckets,
              ],
            };
          }

          return {
            buckets: s.buckets.map((b) =>
              b.label === "today" ? { ...b, items: [...b.items, item] } : b
            ),
          };
        }),

      setPlan: (plan) =>
        set({
          buckets: plan.buckets,
          inbox: plan.inbox,
          itemStatuses: {},
        }),

      setInbox: (inbox) => set({ inbox }),

      resolveInboxTask: (id) =>
        set((s) => ({
          inbox: s.inbox.filter((t) => t.id !== id),
        })),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      reset: () => set(initialState),
    }),
    {
      name: "ratbha-tasks-store",
      storage: createJSONStorage(getTasksStorage),
      partialize: (state) => ({
        buckets: state.buckets,
        inbox: state.inbox,
        searchQuery: state.searchQuery,
        itemStatuses: state.itemStatuses,
      }),
    }
  )
);
