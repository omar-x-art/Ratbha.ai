import { describe, expect, it } from "vitest";
import {
  pickNextUpcoming,
  shouldShowTaskInCalendar,
  type UpcomingCalendarEvent,
} from "@/lib/calendar/upcoming";
import type { PlanItem } from "@/lib/types";

function item(id: string, minutesFromNow: number): PlanItem {
  const start = new Date();
  start.setMinutes(start.getMinutes() + minutesFromNow, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 60);

  return {
    id,
    title: `مهمة ${id}`,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    item_type: "proposed_task",
  };
}

function event(minutesFromNow: number): UpcomingCalendarEvent {
  const start = new Date();
  start.setMinutes(start.getMinutes() + minutesFromNow, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 60);

  return {
    id: "g-1",
    title: "اجتماع Google",
    start: start.toISOString(),
    end: end.toISOString(),
    isAllDay: false,
    kind: "event",
    accountEmail: "user@example.com",
    calendarName: "العمل",
  };
}

describe("upcoming calendar logic", () => {
  it("defaults tasks to visible in calendar", () => {
    expect(shouldShowTaskInCalendar(item("a", 120))).toBe(true);
    expect(
      shouldShowTaskInCalendar({ ...item("b", 120), show_in_calendar: false })
    ).toBe(false);
  });

  it("picks the real next item from tasks or Google events", () => {
    const next = pickNextUpcoming([item("late", 180)], {}, [event(90)]);

    expect(next?.source).toBe("google");
    expect(next?.title).toBe("اجتماع Google");
  });
});
