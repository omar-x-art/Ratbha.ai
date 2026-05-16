import { beforeEach, describe, expect, it } from "vitest";
import { useTasksStore } from "./tasks-store";
import type { DayBucket } from "@/lib/types";

describe("useTasksStore", () => {
  beforeEach(() => {
    useTasksStore.getState().reset();
  });

  it("marks an item as done", () => {
    const item = useTasksStore.getState().buckets[0].items[0];

    useTasksStore.getState().markDone(item.id);

    expect(useTasksStore.getState().itemStatuses[item.id]).toBe("done");
  });

  it("removes an item from buckets", () => {
    const item = useTasksStore.getState().buckets[0].items[0];

    useTasksStore.getState().removeItem(item.id);

    const allItems = useTasksStore.getState().buckets.flatMap((bucket) => bucket.items);
    expect(allItems.some((candidate) => candidate.id === item.id)).toBe(false);
  });

  it("postpones an item by one day", () => {
    const item = useTasksStore.getState().buckets[0].items[0];
    const originalStart = new Date(item.start_time).getTime();

    useTasksStore.getState().postponeItem(item.id);

    const postponed = useTasksStore
      .getState()
      .buckets.flatMap((bucket) => bucket.items)
      .find((candidate) => candidate.id === item.id);

    expect(postponed).toBeTruthy();
    expect(new Date(postponed!.start_time).getTime()).toBe(
      originalStart + 24 * 60 * 60 * 1000
    );
  });

  it("replaces the current plan and clears item statuses", () => {
    const bucket: DayBucket = {
      date: "2026-05-16",
      label: "today",
      arabicLabel: "اليوم",
      items: [
        {
          id: "new-item",
          title: "مهمة جديدة",
          start_time: new Date(2026, 4, 16, 9).toISOString(),
          end_time: new Date(2026, 4, 16, 10).toISOString(),
          item_type: "proposed_task",
        },
      ],
    };

    useTasksStore.getState().markDone("old-item");
    useTasksStore.getState().setPlan({ buckets: [bucket], inbox: [] });

    expect(useTasksStore.getState().buckets).toEqual([bucket]);
    expect(useTasksStore.getState().inbox).toEqual([]);
    expect(useTasksStore.getState().itemStatuses).toEqual({});
  });
});
