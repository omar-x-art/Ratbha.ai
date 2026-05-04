import { describe, it, expect } from "vitest";
import {
  computeFreeSlots,
  scheduleTasks,
  type BusyBlock,
} from "./scheduling-engine";

function ms(year: number, month: number, day: number, hour: number, min = 0) {
  return new Date(year, month - 1, day, hour, min, 0, 0).getTime();
}

describe("computeFreeSlots", () => {
  it("returns one slot when day is empty", () => {
    const start = ms(2026, 5, 4, 0);
    const end = ms(2026, 5, 5, 0);
    const slots = computeFreeSlots([], start, end);
    expect(slots.length).toBe(1);
    expect(slots[0].start).toBe(ms(2026, 5, 4, 9));
    expect(slots[0].end).toBe(ms(2026, 5, 4, 21));
  });

  it("splits free time around a meeting and adds post-meeting buffer", () => {
    const busy: BusyBlock[] = [
      { start: ms(2026, 5, 4, 14), end: ms(2026, 5, 4, 15), isMeeting: true },
    ];
    const slots = computeFreeSlots(busy, ms(2026, 5, 4, 0), ms(2026, 5, 5, 0));
    expect(slots.length).toBe(2);
    // First slot: 09:00 → 14:00
    expect(slots[0].end).toBe(ms(2026, 5, 4, 14));
    // Second slot: 15:25 → 21:00 (post-meeting buffer)
    expect(slots[1].start).toBe(ms(2026, 5, 4, 15, 25));
  });
});

describe("scheduleTasks", () => {
  it("places a flexible task into an empty day", () => {
    const start = ms(2026, 5, 4, 0);
    const end = ms(2026, 5, 5, 0);
    const out = scheduleTasks(
      [
        {
          id: "t1",
          title: "إنهاء العرض",
          duration_minutes: 90,
          energy: "high",
          priority: "high",
        },
      ],
      [],
      start,
      end
    );
    expect(out.scheduled.length).toBe(1);
    expect(out.scheduled[0].start).toBe(ms(2026, 5, 4, 9));
    expect(out.scheduled[0].end).toBe(ms(2026, 5, 4, 10, 30));
  });

  it("does not overlap existing meetings", () => {
    const start = ms(2026, 5, 4, 0);
    const end = ms(2026, 5, 5, 0);
    const busy: BusyBlock[] = [
      { start: ms(2026, 5, 4, 9), end: ms(2026, 5, 4, 10, 30) },
    ];
    const out = scheduleTasks(
      [{ id: "t1", title: "A", duration_minutes: 60 }],
      busy,
      start,
      end
    );
    expect(out.scheduled[0].start).toBeGreaterThanOrEqual(ms(2026, 5, 4, 10, 45));
  });

  it("returns unscheduled when no slot is large enough", () => {
    const start = ms(2026, 5, 4, 0);
    const end = ms(2026, 5, 5, 0);
    const busy: BusyBlock[] = [
      { start: ms(2026, 5, 4, 9), end: ms(2026, 5, 4, 21) },
    ];
    const out = scheduleTasks(
      [{ id: "t1", title: "A", duration_minutes: 60 }],
      busy,
      start,
      end
    );
    expect(out.scheduled.length).toBe(0);
    expect(out.unscheduled.length).toBe(1);
  });
});
