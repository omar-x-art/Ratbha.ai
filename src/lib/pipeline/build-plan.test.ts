import { describe, it, expect } from "vitest";
import { buildPlanFromExtraction } from "./build-plan";
import { extractTasksLocal } from "@/lib/gemini/local-extractor";

const NOW = new Date(2026, 4, 4, 9, 0, 0); // Mon 2026-05-04 9:00

describe("buildPlanFromExtraction (offline / local extractor)", () => {
  it("turns a multi-clause sentence into a planned plan", () => {
    const extraction = extractTasksLocal(
      "عندي اجتماع 2 والجيم بكرة وأخلص العرض الخميس"
    );
    const plan = buildPlanFromExtraction(extraction, { now: NOW, busy: [] });

    expect(plan.buckets.length).toBeGreaterThanOrEqual(2);

    // Each bucket items should be sorted ascending and not overlap each other.
    for (const b of plan.buckets) {
      for (let i = 1; i < b.items.length; i++) {
        const prev = new Date(b.items[i - 1].end_time).getTime();
        const cur = new Date(b.items[i].start_time).getTime();
        expect(cur).toBeGreaterThanOrEqual(prev);
      }
    }
  });

  it("includes a fixed meeting as an existing_event", () => {
    const extraction = extractTasksLocal("اجتماع 2");
    const plan = buildPlanFromExtraction(extraction, { now: NOW });
    const fixed = plan.buckets
      .flatMap((b) => b.items)
      .find((it) => it.item_type === "existing_event");
    expect(fixed).toBeTruthy();
    expect(fixed!.is_locked).toBe(true);
  });

  it("routes ambiguous date_expression to inbox", () => {
    const extraction: import("@/lib/gemini/schema").TaskExtraction = {
      language: "ar",
      timezone: "Asia/Riyadh",
      tasks: [
        {
          title: "راجع الفواتير",
          date_expression: "لما أفضى",
          resolved_date_hint: null,
          time_expression: null,
          duration_minutes: 30,
          priority: "medium",
          energy: "medium",
          flexibility: "flexible",
          type: "task",
          confidence: 0.7,
        },
      ],
      fixed_events_mentioned: [],
      ambiguities: [],
    };
    const plan = buildPlanFromExtraction(extraction, { now: NOW });
    expect(plan.inbox.length).toBeGreaterThan(0);
  });

  it("auto-suggests a day for tasks without an explicit date_expression", () => {
    const extraction = extractTasksLocal("راجع الفواتير");
    const plan = buildPlanFromExtraction(extraction, { now: NOW });
    // Should NOT go to inbox — should appear in a bucket so the user
    // can edit/move it via the UI rather than having to type a date.
    expect(plan.inbox.length).toBe(0);
    const allItems = plan.buckets.flatMap((b) => b.items);
    expect(allItems.length).toBeGreaterThan(0);
  });

  it("avoids overlapping with provided busy blocks", () => {
    const busy = [
      {
        start: new Date(2026, 4, 4, 10, 0).getTime(),
        end: new Date(2026, 4, 4, 12, 0).getTime(),
        isMeeting: true,
      },
    ];
    const extraction = extractTasksLocal("أخلص التقرير اليوم");
    const plan = buildPlanFromExtraction(extraction, { now: NOW, busy });
    const items = plan.buckets.flatMap((b) => b.items);
    for (const it of items) {
      const s = new Date(it.start_time).getTime();
      const e = new Date(it.end_time).getTime();
      for (const b of busy) {
        const overlap = s < b.end && e > b.start;
        expect(overlap).toBe(false);
      }
    }
  });
});
