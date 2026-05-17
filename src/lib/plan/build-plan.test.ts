import { describe, expect, it } from "vitest";
import { buildPlanFromExtraction, buildPlanFromText } from "./build-plan";
import type { TaskExtraction } from "@/lib/gemini/schema";

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

  it("rewrites conversational Arabic into professional task titles and dates", () => {
    const result = buildPlanFromText(
      "انا عندي النهاردة اخلص تقرير العميل وبكرة اكلم محمد الساعة ٤",
      { now: NOW }
    );

    const todayItems =
      result.plan.buckets.find((bucket) => bucket.label === "today")?.items ?? [];
    const tomorrowItems =
      result.plan.buckets.find((bucket) => bucket.label === "tomorrow")?.items ?? [];

    expect(todayItems.some((item) => item.title === "إنهاء تقرير العميل")).toBe(
      true
    );
    expect(tomorrowItems.some((item) => item.title === "مكالمة مع محمد")).toBe(
      true
    );
    expect(
      tomorrowItems.some((item) => new Date(item.start_time).getHours() === 16)
    ).toBe(true);
  });

  it("uses calendar events as busy time when suggesting a slot", () => {
    const result = buildPlanFromText("أخلص التقرير النهاردة", {
      now: new Date(2026, 4, 4, 8, 0, 0),
      calendarEvents: [
        {
          id: "google-1",
          title: "اجتماع Google",
          start: new Date(2026, 4, 4, 9, 0, 0).toISOString(),
          end: new Date(2026, 4, 4, 10, 0, 0).toISOString(),
          isMeeting: true,
          isAllDay: false,
          kind: "event",
          accountId: "acc-1",
          accountEmail: "omar@example.com",
          calendarId: "primary",
          calendarName: "Google Calendar",
        },
      ],
    });

    const report =
      result.plan.buckets
        .find((bucket) => bucket.label === "today")
        ?.items.find((item) => item.title === "إنهاء التقرير") ?? null;

    expect(report).toBeTruthy();
    expect(new Date(report!.start_time).getTime()).toBeGreaterThanOrEqual(
      new Date(2026, 4, 4, 10, 25, 0).getTime()
    );
    expect(report!.reason).toContain("التقويم");
  });

  it("builds a plan directly from AI extraction without losing polished titles", () => {
    const extraction: TaskExtraction = {
      language: "ar",
      timezone: "Africa/Cairo",
      tasks: [
        {
          title: "مراجعة عرض العميل",
          date_expression: "بكرة",
          resolved_date_hint: "2026-05-05",
          time_expression: null,
          duration_minutes: 45,
          priority: "high",
          energy: "high",
          flexibility: "flexible",
          confidence: 0.92,
        },
      ],
      fixed_events_mentioned: [],
      ambiguities: [],
    };

    const result = buildPlanFromExtraction("راجع عرض العميل بكرة", extraction, {
      now: NOW,
    });
    const tomorrowItems =
      result.plan.buckets.find((bucket) => bucket.label === "tomorrow")?.items ?? [];

    expect(tomorrowItems.some((item) => item.title === "مراجعة عرض العميل")).toBe(
      true
    );
  });
});
