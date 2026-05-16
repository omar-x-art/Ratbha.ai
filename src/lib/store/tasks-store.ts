import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import type { DayBucket, PillStatus, Plan, PlanItem, Task } from "@/lib/types";
import { MOCK_PLAN } from "@/lib/mock/plans";

interface AddQuickItemOptions {
  date?: string;
  time?: string;
  durationMinutes?: number;
}

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
  addQuickItem: (title: string, options?: AddQuickItemOptions) => void;
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

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getBucketMeta(date: Date): Pick<DayBucket, "date" | "label" | "arabicLabel"> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);

  if (isSameDate(normalized, today)) {
    return { date: toDateKey(date), label: "today", arabicLabel: "اليوم" };
  }

  if (isSameDate(normalized, tomorrow)) {
    return { date: toDateKey(date), label: "tomorrow", arabicLabel: "غداً" };
  }

  return { date: toDateKey(date), label: "later", arabicLabel: "لاحقاً" };
}

function sortItems(items: PlanItem[]) {
  return [...items].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
}

function sortBuckets(buckets: DayBucket[]) {
  return [...buckets].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

function upsertItemInBucket(buckets: DayBucket[], item: PlanItem) {
  const meta = getBucketMeta(new Date(item.start_time));
  let found = false;

  const nextBuckets = buckets.map((bucket) => {
    const withoutItem = bucket.items.filter((it) => it.id !== item.id);
    if (bucket.date !== meta.date) return { ...bucket, items: withoutItem };
    found = true;
    return { ...bucket, ...meta, items: sortItems([...withoutItem, item]) };
  });

  if (!found) {
    nextBuckets.push({ ...meta, items: [item] });
  }

  return sortBuckets(nextBuckets).filter((bucket) => bucket.items.length > 0);
}

function buildStartDate(options?: AddQuickItemOptions) {
  const start = new Date();
  const roundedMinutes = Math.ceil(start.getMinutes() / 30) * 30;
  start.setMinutes(roundedMinutes, 0, 0);
  start.setTime(start.getTime() + 30 * 60 * 1000);

  if (options?.date) {
    const [year, month, day] = options.date.split("-").map(Number);
    start.setFullYear(year, month - 1, day);
  }

  if (options?.time) {
    const [hour, minute] = options.time.split(":").map(Number);
    start.setHours(hour, minute, 0, 0);
  }

  return start;
}

function createQuickItem(title: string, options?: AddQuickItemOptions): PlanItem {
  const start = buildStartDate(options);
  const duration = Math.max(options?.durationMinutes ?? 30, 5);
  const end = new Date(start.getTime() + duration * 60 * 1000);

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
        set((s) => {
          const current = s.buckets
            .flatMap((bucket) => bucket.items)
            .find((item) => item.id === id);
          if (!current) return s;
          return { buckets: upsertItemInBucket(s.buckets, { ...current, ...patch }) };
        }),

      removeItem: (id) =>
        set((s) => ({
          buckets: s.buckets
            .map((b) => ({
              ...b,
              items: b.items.filter((it) => it.id !== id),
            }))
            .filter((b) => b.items.length > 0),
        })),

      postponeItem: (id) =>
        set((s) => {
          const current = s.buckets
            .flatMap((bucket) => bucket.items)
            .find((item) => item.id === id);
          if (!current) return s;

          const start = new Date(current.start_time);
          const end = new Date(current.end_time);
          start.setDate(start.getDate() + 1);
          end.setDate(end.getDate() + 1);

          return {
            buckets: upsertItemInBucket(s.buckets, {
              ...current,
              start_time: start.toISOString(),
              end_time: end.toISOString(),
              reason: "أجلتها للغد",
            }),
          };
        }),

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

      addQuickItem: (title, options) =>
        set((s) => ({
          buckets: upsertItemInBucket(s.buckets, createQuickItem(title, options)),
        })),

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
