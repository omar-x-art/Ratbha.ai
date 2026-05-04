import { describe, it, expect } from "vitest";
import { extractTasksLocal } from "./local-extractor";

describe("extractTasksLocal", () => {
  it("extracts tasks from a multi-clause Arabic sentence", () => {
    const out = extractTasksLocal(
      "عندي اجتماع 2 والجيم بكرة وأخلص التقرير الخميس"
    );
    const titles = [
      ...out.tasks.map((t) => t.title),
      ...out.fixed_events_mentioned.map((f) => f.title),
    ];
    expect(titles.some((t) => t.includes("اجتماع"))).toBe(true);
    expect(titles.some((t) => t.includes("الجيم"))).toBe(true);
    expect(titles.some((t) => t.includes("التقرير"))).toBe(true);
  });

  it("classifies meetings as fixed events", () => {
    const out = extractTasksLocal("اجتماع مع الفريق 3");
    expect(out.fixed_events_mentioned.length).toBe(1);
    expect(out.fixed_events_mentioned[0].time_expression).toMatch(/3/);
  });

  it("flags بعد الشغل as ambiguous", () => {
    const out = extractTasksLocal("الجيم بعد الشغل");
    expect(out.ambiguities.some((a) => a.text === "بعد الشغل")).toBe(true);
  });

  it("treats deep-work cues as high-energy 90-minute tasks", () => {
    const out = extractTasksLocal("أخلص العرض بكرة");
    const t = out.tasks.find((x) => x.title.includes("العرض"));
    expect(t).toBeTruthy();
    expect(t!.duration_minutes).toBe(90);
    expect(t!.energy).toBe("high");
  });

  it("ignores standalone date words", () => {
    const out = extractTasksLocal("بكرة");
    expect(out.tasks.length + out.fixed_events_mentioned.length).toBe(0);
  });
});
