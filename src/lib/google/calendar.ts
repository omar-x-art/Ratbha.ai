/**
 * Google Calendar API client (REST, no SDK).
 *  - listEvents: window of busy events from primary calendar
 *  - insertEvent: single event create
 *  - insertEventsBatch: multi-insert via sequential POSTs (small N)
 */

export interface GcalEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  status?: string;
  attendees?: Array<{ email: string }>;
}

const BASE = "https://www.googleapis.com/calendar/v3";

async function gcalFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`gcal_${res.status}:${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export async function listEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
  calendarId = "primary"
): Promise<GcalEvent[]> {
  const u = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "100",
  });
  const res = await gcalFetch<{ items: GcalEvent[] }>(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events?${u.toString()}`
  );
  return res.items ?? [];
}

export interface NewEvent {
  summary: string;
  description?: string;
  start: string; // ISO
  end: string; // ISO
  reminders?: boolean;
}

export async function insertEvent(
  accessToken: string,
  ev: NewEvent,
  calendarId = "primary"
): Promise<GcalEvent> {
  return await gcalFetch<GcalEvent>(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      body: JSON.stringify({
        summary: ev.summary,
        description: ev.description,
        start: { dateTime: ev.start },
        end: { dateTime: ev.end },
        reminders: ev.reminders
          ? {
              useDefault: false,
              overrides: [
                { method: "popup", minutes: 10 },
                { method: "popup", minutes: 30 },
              ],
            }
          : { useDefault: true },
      }),
    }
  );
}

export async function insertEventsBatch(
  accessToken: string,
  events: NewEvent[],
  calendarId = "primary"
): Promise<GcalEvent[]> {
  const results: GcalEvent[] = [];
  for (const ev of events) {
    const created = await insertEvent(accessToken, ev, calendarId);
    results.push(created);
  }
  return results;
}
