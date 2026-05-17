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

  it("adds a quick item with an explicit time and duration", () => {
    useTasksStore.getState().addQuickItem("مهمة محددة الوقت", {
      date: "2026-05-17",
      time: "15:45",
      durationMinutes: 45,
    });

    const item = useTasksStore
      .getState()
      .buckets.flatMap((bucket) => bucket.items)
      .find((candidate) => candidate.title === "مهمة محددة الوقت");

    expect(item).toBeTruthy();
    expect(new Date(item!.start_time).getHours()).toBe(15);
    expect(new Date(item!.start_time).getMinutes()).toBe(45);
    expect(new Date(item!.end_time).getTime() - new Date(item!.start_time).getTime()).toBe(
      45 * 60 * 1000
    );
  });

  it("adds a quick item that can stay out of the calendar", () => {
    useTasksStore.getState().addQuickItem("مهمة داخل اليوم فقط", {
      date: "2026-05-17",
      time: "17:00",
      showInCalendar: false,
    });

    const item = useTasksStore
      .getState()
      .buckets.flatMap((bucket) => bucket.items)
      .find((candidate) => candidate.title === "مهمة داخل اليوم فقط");

    expect(item?.show_in_calendar).toBe(false);
  });

  it("moves an item to the bucket matching its edited date", () => {
    const item = useTasksStore.getState().buckets[0].items[0];
    const nextStart = new Date(item.start_time);
    nextStart.setDate(nextStart.getDate() + 3);
    const nextEnd = new Date(nextStart.getTime() + 30 * 60 * 1000);

    useTasksStore.getState().updateItem(item.id, {
      start_time: nextStart.toISOString(),
      end_time: nextEnd.toISOString(),
    });

    const bucket = useTasksStore
      .getState()
      .buckets.find((candidate) =>
        candidate.items.some((candidateItem) => candidateItem.id === item.id)
      );

    expect(bucket?.date).toBe(
      `${nextStart.getFullYear()}-${String(nextStart.getMonth() + 1).padStart(2, "0")}-${String(nextStart.getDate()).padStart(2, "0")}`
    );
  });

  it("updates an item title", () => {
    const item = useTasksStore.getState().buckets[0].items[0];

    useTasksStore.getState().updateItem(item.id, {
      title: "عنوان معدل",
    });

    const updated = useTasksStore
      .getState()
      .buckets.flatMap((bucket) => bucket.items)
      .find((candidate) => candidate.id === item.id);

    expect(updated?.title).toBe("عنوان معدل");
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
