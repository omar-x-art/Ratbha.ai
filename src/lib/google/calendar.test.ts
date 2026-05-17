import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCalendarEvents } from "@/lib/google/calendar";

const ORIGINAL_TOKEN = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN;

describe("google calendar events", () => {
  beforeEach(() => {
    process.env.GOOGLE_CALENDAR_ACCESS_TOKEN = "legacy-token";
  });

  afterEach(() => {
    if (ORIGINAL_TOKEN) {
      process.env.GOOGLE_CALENDAR_ACCESS_TOKEN = ORIGINAL_TOKEN;
    } else {
      delete process.env.GOOGLE_CALENDAR_ACCESS_TOKEN;
    }

    vi.unstubAllGlobals();
  });

  it("reads selected calendars and marks holiday calendars as occasions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/users/me/calendarList")) {
          return Response.json({
            items: [
              {
                id: "primary",
                summary: "الرئيسي",
                primary: true,
                selected: true,
                accessRole: "owner",
              },
              {
                id: "en.egyptian#holiday@group.v.calendar.google.com",
                summary: "Holidays in Egypt",
                selected: true,
                accessRole: "reader",
                backgroundColor: "#f59e0b",
              },
            ],
          });
        }

        if (url.includes(encodeURIComponent("en.egyptian#holiday@group.v.calendar.google.com"))) {
          return Response.json({
            items: [
              {
                id: "labor-day",
                summary: "عيد العمال",
                start: { date: "2026-05-01" },
                end: { date: "2026-05-02" },
              },
            ],
          });
        }

        return Response.json({
          items: [
            {
              id: "daily-standup",
              summary: "مكالمة الفريق",
              start: { dateTime: "2026-05-01T09:00:00+03:00" },
              end: { dateTime: "2026-05-01T09:30:00+03:00" },
            },
          ],
        });
      })
    );

    const result = await fetchCalendarEvents({
      timeMin: new Date("2026-05-01T00:00:00+03:00"),
      timeMax: new Date("2026-05-02T00:00:00+03:00"),
    });

    expect(result.mode).toBe("legacy");
    expect(result.events).toHaveLength(2);
    expect(result.events.find((event) => event.id.includes("labor-day"))).toMatchObject({
      title: "عيد العمال",
      kind: "occasion",
      calendarName: "Holidays in Egypt",
      isAllDay: true,
    });
    expect(result.events.find((event) => event.id.includes("daily-standup"))).toMatchObject({
      title: "مكالمة الفريق",
      kind: "event",
      calendarName: "الرئيسي",
      isAllDay: false,
    });
  });
});
