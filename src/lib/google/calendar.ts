import type { PlanItem } from "@/lib/types";

export interface CalendarBusyEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isMeeting: boolean;
}

interface GoogleEventDate {
  dateTime?: string;
  date?: string;
}

interface GoogleCalendarEvent {
  id?: string;
  summary?: string;
  start?: GoogleEventDate;
  end?: GoogleEventDate;
}

interface GoogleEventsResponse {
  items?: GoogleCalendarEvent[];
}

interface SavedCalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  google_event_id: string;
}

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export async function fetchCalendarEvents({
  timeMin,
  timeMax,
}: {
  timeMin: Date;
  timeMax: Date;
}): Promise<{ events: CalendarBusyEvent[]; mode: "google" | "mock" }> {
  const token = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN;
  if (!token) return { events: createMockEvents(), mode: "mock" };

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
  });

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) return { events: createMockEvents(), mode: "mock" };

  const data = (await response.json()) as GoogleEventsResponse;
  return {
    events: (data.items ?? []).flatMap(mapGoogleEvent),
    mode: "google",
  };
}

export async function saveCalendarEvents(
  items: Pick<PlanItem, "id" | "title" | "start_time" | "end_time">[]
): Promise<{ saved: SavedCalendarEvent[]; mode: "google" | "mock" }> {
  const token = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN;
  if (!token) return { saved: createMockSavedEvents(items), mode: "mock" };

  const saved: SavedCalendarEvent[] = [];

  for (const item of items) {
    const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: item.title,
        start: { dateTime: item.start_time },
        end: { dateTime: item.end_time },
      }),
    });

    if (!response.ok) return { saved: createMockSavedEvents(items), mode: "mock" };

    const event = (await response.json()) as GoogleCalendarEvent;
    saved.push({
      ...item,
      google_event_id: event.id ?? `gcal_${item.id}`,
    });
  }

  return { saved, mode: "google" };
}

function mapGoogleEvent(event: GoogleCalendarEvent): CalendarBusyEvent[] {
  const start = event.start?.dateTime ?? event.start?.date;
  const end = event.end?.dateTime ?? event.end?.date;
  if (!start || !end) return [];

  const title = event.summary ?? "حدث في التقويم";

  return [
    {
      id: event.id ?? `event-${start}`,
      title,
      start,
      end,
      isMeeting: /(اجتماع|meeting|meet|call|مكالمة)/i.test(title),
    },
  ];
}

function createMockEvents(): CalendarBusyEvent[] {
  const now = new Date();
  const start = new Date(now);
  start.setHours(14, 0, 0, 0);
  const end = new Date(now);
  end.setHours(15, 0, 0, 0);

  return [
    {
      id: "ev-1",
      title: "اجتماع",
      start: start.toISOString(),
      end: end.toISOString(),
      isMeeting: true,
    },
  ];
}

function createMockSavedEvents(
  items: Pick<PlanItem, "id" | "title" | "start_time" | "end_time">[]
): SavedCalendarEvent[] {
  return items.map((item) => ({
    ...item,
    google_event_id: `gcal_mock_${item.id}_${Date.now()}`,
  }));
}
