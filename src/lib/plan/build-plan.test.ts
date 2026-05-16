import { describe, expect, it } from "vitest";
import { buildPlanFromText } from "./build-plan";

const NOW = new Date(2026, 4, 4, 10, 0, 0);

describe("buildPlanFromText", () => {
  it("builds a plan with a fixed event, scheduled task, and ambiguity", () => {
    const result = buildPlanFromText(
      "عندي اجتماع الساعة ٢، أخلص العرض بكرة، راجع الفواتير لما أفضى",
      { now: NOW }
    );

    expect(result.extraction.fixed_events_mentioned.length).toBe(1);
    expect(result.extraction.tasks.length).toBe(1);
    expect(result.plan.inbox.length).toBe(1);

    const today = result.plan.buckets.find((bucket) => bucket.label === "today");
    const tomorrow = result.plan.buckets.find(
      (bucket) => bucket.label === "tomorrow"
    );

    expect(today?.items.some((item) => item.item_type === "existing_event")).toBe(
      true
    );
    expect(tomorrow?.items.some((item) => item.title.includes("العرض"))).toBe(
      true
    );
  });

  it("does not schedule a flexible task over a fixed event", () => {
    const result = buildPlanFromText(
      "عندي اجتماع الساعة ٩، أخلص التقرير اليوم",
      { now: NOW }
    );

    const todayItems =
      result.plan.buckets.find((bucket) => bucket.label === "today")?.items ?? [];
    const meeting = todayItems.find((item) => item.item_type === "existing_event");
    const report = todayItems.find((item) => item.title.includes("التقرير"));

    expect(meeting).toBeTruthy();
    expect(report).toBeTruthy();
    expect(new Date(report!.start_time).getTime()).toBeGreaterThanOrEqual(
      new Date(meeting!.end_time).getTime()
    );
  });
});
