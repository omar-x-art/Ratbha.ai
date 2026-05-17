"use client";

import * as React from "react";
import type { UpcomingCalendarEvent } from "@/lib/calendar/upcoming";

interface CalendarEventsResponse {
  events: UpcomingCalendarEvent[];
}

export function useUpcomingCalendarEvents(days = 14) {
  const [events, setEvents] = React.useState<UpcomingCalendarEvent[]>([]);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">(
    "loading"
  );

  React.useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setStatus("loading");
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + days);

      try {
        const params = new URLSearchParams({
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
        });
        const response = await fetch(`/api/calendar/events?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("calendar_events_failed");
        const data = (await response.json()) as CalendarEventsResponse;
        setEvents(data.events ?? []);
        setStatus("ready");
      } catch {
        if (controller.signal.aborted) return;
        setEvents([]);
        setStatus("error");
      }
    }

    void load();

    return () => controller.abort();
  }, [days]);

  return { events, status };
}
