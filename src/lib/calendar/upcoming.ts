import type { PillStatus, PlanItem } from "@/lib/types";

export type UpcomingSource = "task" | "google" | "occasion";

export interface UpcomingCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
  kind: "event" | "occasion";
  accountEmail: string;
  accountName?: string;
  calendarName: string;
}

export interface UpcomingEntry {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  source: UpcomingSource;
  task?: PlanItem;
  accountEmail?: string;
  accountName?: string;
  calendarName?: string;
}

export function shouldShowTaskInCalendar(
  item: Pick<PlanItem, "show_in_calendar">
) {
  return item.show_in_calendar !== false;
}

export function findNextUpcomingTask(
  items: PlanItem[],
  itemStatuses: Record<string, PillStatus>
): UpcomingEntry | null {
  const now = Date.now();
  const item =
    [...items]
      .filter(
        (candidate) =>
          itemStatuses[candidate.id] !== "done" &&
          new Date(candidate.end_time).getTime() >= now
      )
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )[0] ?? null;

  return item
    ? {
        id: item.id,
        title: item.title,
        start_time: item.start_time,
        end_time: item.end_time,
        source: "task",
        task: item,
      }
    : null;
}

export function findNextUpcomingCalendarEvent(
  events: UpcomingCalendarEvent[]
): UpcomingEntry | null {
  const now = Date.now();
  const event =
    [...events]
      .filter(
        (candidate) =>
          !candidate.isAllDay && new Date(candidate.end).getTime() >= now
      )
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0] ??
    null;

  return event
    ? {
        id: event.id,
        title: event.title,
        start_time: event.start,
        end_time: event.end,
        source: event.kind === "occasion" ? "occasion" : "google",
        accountEmail: event.accountEmail,
        accountName: event.accountName,
        calendarName: event.calendarName,
      }
    : null;
}

export function pickNextUpcoming(
  tasks: PlanItem[],
  itemStatuses: Record<string, PillStatus>,
  events: UpcomingCalendarEvent[]
) {
  const candidates = [
    findNextUpcomingTask(tasks, itemStatuses),
    findNextUpcomingCalendarEvent(events),
  ].filter((item): item is UpcomingEntry => Boolean(item));

  return (
    candidates.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )[0] ?? null
  );
}

export function getUpcomingSourceLabel(entry: UpcomingEntry) {
  if (entry.source === "task") {
    return entry.task && shouldShowTaskInCalendar(entry.task)
      ? "مهامك · التقويم"
      : "مهامك فقط";
  }

  if (entry.source === "occasion") {
    return entry.calendarName ? `مناسبة · ${entry.calendarName}` : "مناسبة";
  }

  return entry.calendarName
    ? `Google · ${entry.calendarName}`
    : `Google · ${entry.accountName ?? entry.accountEmail}`;
}
