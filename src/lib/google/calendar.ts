import type { PlanItem } from "@/lib/types";
import type {
  GoogleCalendarAccount,
  PublicGoogleCalendarAccount,
} from "@/lib/google/calendar-session";
import { toPublicGoogleAccounts } from "@/lib/google/calendar-session";
import { refreshGoogleAccessToken } from "@/lib/google/oauth";

export interface CalendarBusyEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isMeeting: boolean;
  isAllDay: boolean;
  accountId: string;
  accountEmail: string;
  accountName?: string;
}

export interface CalendarFetchError {
  accountId: string;
  email: string;
  message: string;
}

export type CalendarApiMode = "google" | "legacy" | "not_connected" | "error";

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
  accounts = [],
}: {
  timeMin: Date;
  timeMax: Date;
  accounts?: GoogleCalendarAccount[];
}): Promise<{
  events: CalendarBusyEvent[];
  mode: CalendarApiMode;
  accounts: PublicGoogleCalendarAccount[];
  errors: CalendarFetchError[];
}> {
  if (accounts.length === 0) {
    const legacyToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN;
    if (!legacyToken) {
      return {
        events: [],
        mode: "not_connected",
        accounts: [],
        errors: [],
      };
    }

    const legacyAccount = {
      id: "legacy",
      email: "الحساب الافتراضي",
      connectedAt: new Date().toISOString(),
    };

    try {
      return {
        events: await fetchEventsWithAccessToken({
          token: legacyToken,
          account: legacyAccount,
          timeMin,
          timeMax,
        }),
        mode: "legacy",
        accounts: [legacyAccount],
        errors: [],
      };
    } catch (error) {
      return {
        events: [],
        mode: "error",
        accounts: [legacyAccount],
        errors: [
          {
            accountId: legacyAccount.id,
            email: legacyAccount.email,
            message: getErrorMessage(error),
          },
        ],
      };
    }
  }

  const results = await Promise.all(
    accounts.map(async (account) => {
      try {
        const token = await refreshGoogleAccessToken(account.refreshToken);
        const events = await fetchEventsWithAccessToken({
          token,
          account,
          timeMin,
          timeMax,
        });
        return { account, events, error: null as string | null };
      } catch (error) {
        return { account, events: [], error: getErrorMessage(error) };
      }
    })
  );

  const events = results.flatMap((result) => result.events);
  const errors = results.flatMap<CalendarFetchError>((result) =>
    result.error
      ? [
          {
            accountId: result.account.id,
            email: result.account.email,
            message: result.error,
          },
        ]
      : []
  );

  return {
    events: events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    mode: errors.length === accounts.length ? "error" : "google",
    accounts: toPublicGoogleAccounts(accounts),
    errors,
  };
}

export async function saveCalendarEvents(
  items: Pick<PlanItem, "id" | "title" | "start_time" | "end_time">[],
  options: { accounts?: GoogleCalendarAccount[]; accountId?: string } = {}
): Promise<{
  saved: SavedCalendarEvent[];
  mode: CalendarApiMode;
  account?: PublicGoogleCalendarAccount;
  error?: string;
}> {
  const account =
    options.accounts?.find((item) => item.id === options.accountId) ??
    options.accounts?.[0];

  if (!account) {
    const legacyToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN;
    if (!legacyToken) return { saved: [], mode: "not_connected" };
    return saveCalendarEventsWithToken(items, legacyToken, "legacy");
  }

  try {
    const token = await refreshGoogleAccessToken(account.refreshToken);
    const result = await saveCalendarEventsWithToken(items, token, "google");
    return { ...result, account: accountToPublic(account) };
  } catch (error) {
    return {
      saved: [],
      mode: "error",
      account: accountToPublic(account),
      error: getErrorMessage(error),
    };
  }
}

async function fetchEventsWithAccessToken({
  token,
  account,
  timeMin,
  timeMax,
}: {
  token: string;
  account: Pick<GoogleCalendarAccount, "id" | "email" | "name">;
  timeMin: Date;
  timeMax: Date;
}) {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "2500",
  });

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) throw new Error(`calendar_events_${response.status}`);

  const data = (await response.json()) as GoogleEventsResponse;
  return (data.items ?? []).flatMap((event) => mapGoogleEvent(event, account));
}

async function saveCalendarEventsWithToken(
  items: Pick<PlanItem, "id" | "title" | "start_time" | "end_time">[],
  token: string,
  mode: "google" | "legacy"
) {
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
        description: "أضيف بواسطة رتّبها AI",
        start: { dateTime: item.start_time },
        end: { dateTime: item.end_time },
      }),
    });

    if (!response.ok) throw new Error(`calendar_save_${response.status}`);

    const event = (await response.json()) as GoogleCalendarEvent;
    saved.push({
      ...item,
      google_event_id: event.id ?? `gcal_${item.id}`,
    });
  }

  return { saved, mode };
}

function mapGoogleEvent(
  event: GoogleCalendarEvent,
  account: Pick<GoogleCalendarAccount, "id" | "email" | "name">
): CalendarBusyEvent[] {
  const start = normalizeGoogleDate(event.start);
  const end = normalizeGoogleDate(event.end);
  if (!start || !end) return [];

  const title = event.summary ?? "حدث في التقويم";

  return [
    {
      id: `${account.id}:${event.id ?? start.value}`,
      title,
      start: start.value,
      end: end.value,
      isMeeting: /(اجتماع|meeting|meet|call|مكالمة)/i.test(title),
      isAllDay: start.isAllDay,
      accountId: account.id,
      accountEmail: account.email,
      accountName: account.name,
    },
  ];
}

function normalizeGoogleDate(value?: GoogleEventDate) {
  if (value?.dateTime) return { value: value.dateTime, isAllDay: false };
  if (!value?.date) return null;

  const [year, month, day] = value.date.split("-").map(Number);
  return {
    value: new Date(year, month - 1, day, 0, 0, 0, 0).toISOString(),
    isAllDay: true,
  };
}

function accountToPublic(account: GoogleCalendarAccount): PublicGoogleCalendarAccount {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    picture: account.picture,
    connectedAt: account.connectedAt,
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "google_calendar_error";
}
