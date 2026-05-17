"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
} from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { BottomNav } from "@/components/shell/BottomNav";
import { StatusPill } from "@/components/plan/StatusPill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { arabicWeekday, cn, formatTimeRange } from "@/lib/utils";
import { useTasksStore } from "@/lib/store/tasks-store";
import { shouldShowTaskInCalendar } from "@/lib/calendar/upcoming";
import type { DayBucket, PillStatus, PlanItem } from "@/lib/types";

type ViewMode = "day" | "week" | "month";
type CalendarLoadState = "loading" | "ready" | "error";

interface CalendarCell {
  date: Date;
  inCurrentMonth: boolean;
}

interface GoogleCalendarAccount {
  id: string;
  email: string;
  name?: string;
}

interface CalendarBusyEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
  kind: "event" | "occasion";
  accountId: string;
  accountEmail: string;
  accountName?: string;
  calendarId: string;
  calendarName: string;
  calendarColor?: string;
}

interface CalendarFetchError {
  accountId: string;
  email: string;
  message: string;
}

interface CalendarEventsResponse {
  configured: boolean;
  mode: "google" | "legacy" | "not_connected" | "error";
  accounts: GoogleCalendarAccount[];
  events: CalendarBusyEvent[];
  errors: CalendarFetchError[];
}

type DisplayCalendarItem = PlanItem & {
  source: "ratbha" | "google" | "occasion";
  accountEmail?: string;
  accountName?: string;
  calendarName?: string;
  calendarColor?: string;
  isAllDay?: boolean;
};

const AR_DAYS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];
const HOURS = Array.from({ length: 17 }, (_, index) => index + 6);
const DAY_START_HOUR = HOURS[0];
const DAY_END_HOUR = HOURS[HOURS.length - 1] + 1;
const HOUR_HEIGHT = 62;
const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: "day", label: "يوم" },
  { id: "week", label: "أسبوع" },
  { id: "month", label: "شهر" },
];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function buildMonthCells(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = firstDay; i > 0; i--) {
    cells.push({ date: new Date(year, month, 1 - i), inCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), inCurrentMonth: true });
  }

  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    cells.push({ date: next, inCurrentMonth: false });
  }

  return cells;
}

function buildEventMap(
  buckets: DayBucket[],
  googleEvents: CalendarBusyEvent[]
): Map<string, DisplayCalendarItem[]> {
  const map = new Map<string, DisplayCalendarItem[]>();

  buckets.forEach((bucket) => {
    bucket.items.forEach((item) => {
      if (!shouldShowTaskInCalendar(item)) return;
      appendItem(map, {
        ...item,
        source: "ratbha",
        isAllDay: false,
      });
    });
  });

  googleEvents.forEach((event) => {
    appendItem(map, {
      id: `google-${event.id}`,
      title: event.title,
      start_time: event.start,
      end_time: event.end,
      item_type: "existing_event",
      google_event_id: event.id,
      is_locked: true,
      reason: event.accountEmail,
      source: event.kind === "occasion" ? "occasion" : "google",
      accountEmail: event.accountEmail,
      accountName: event.accountName,
      calendarName: event.calendarName,
      calendarColor: event.calendarColor,
      isAllDay: event.isAllDay,
    });
  });

  Array.from(map.values()).forEach((items) => {
    items.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  });

  return map;
}

function appendItem(
  map: Map<string, DisplayCalendarItem[]>,
  item: DisplayCalendarItem
) {
  const key = dateKey(new Date(item.start_time));
  map.set(key, [...(map.get(key) ?? []), item]);
}

function getEventsForDate(
  date: Date,
  eventMap: Map<string, DisplayCalendarItem[]>
) {
  return eventMap.get(dateKey(date)) ?? [];
}

function addToDate(date: Date, view: ViewMode, amount: number) {
  const next = new Date(date);
  if (view === "month") next.setMonth(next.getMonth() + amount);
  if (view === "week") next.setDate(next.getDate() + amount * 7);
  if (view === "day") next.setDate(next.getDate() + amount);
  return next;
}

function formatClock(date: Date) {
  return date.toLocaleTimeString("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatHour(hour: number) {
  const h = hour > 12 ? hour - 12 : hour;
  return `${h} ${hour >= 12 ? "م" : "ص"}`;
}

function getHeaderTitle(view: ViewMode, selectedDate: Date) {
  if (view === "month") {
    return `${AR_MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  }

  if (view === "week") {
    const weekDays = getWeekDays(selectedDate);
    return `${weekDays[0].getDate()} ${AR_MONTHS[weekDays[0].getMonth()]} - ${weekDays[6].getDate()} ${AR_MONTHS[weekDays[6].getMonth()]}`;
  }

  return `${arabicWeekday(selectedDate)} ${selectedDate.getDate()} ${AR_MONTHS[selectedDate.getMonth()]}`;
}

function getItemStatus(
  item: DisplayCalendarItem,
  itemStatuses: Record<string, PillStatus>
): PillStatus {
  if (item.source !== "ratbha") return "active";
  if (itemStatuses[item.id]) return itemStatuses[item.id];
  if (item.is_locked) return "active";
  return "planned";
}

function getBlockStyle(item: DisplayCalendarItem): React.CSSProperties {
  const start = new Date(item.start_time);
  const end = new Date(item.end_time);
  const dayStart = DAY_START_HOUR * 60;
  const dayEnd = DAY_END_HOUR * 60;
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const visibleStart = Math.max(dayStart, Math.min(dayEnd, startMinutes));
  const visibleEnd = Math.max(visibleStart + 20, Math.min(dayEnd, endMinutes));
  const top = ((visibleStart - dayStart) / 60) * HOUR_HEIGHT + 4;
  const height = Math.max(((visibleEnd - visibleStart) / 60) * HOUR_HEIGHT - 8, 40);

  return { top, height };
}

function getEventClasses(item: DisplayCalendarItem, status: PillStatus) {
  if (item.source === "occasion") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  if (item.source === "google") {
    return "border-sky-200 bg-sky-50 text-sky-900";
  }
  if (status === "done") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "overdue") return "border-red-200 bg-red-50 text-red-800";
  if (item.is_locked || item.item_type === "existing_event") {
    return "border-primary-200 bg-primary-50 text-primary-800";
  }
  return "border-secondary-200 bg-secondary-50 text-secondary-800";
}

function getAllDayPrefix(item: DisplayCalendarItem) {
  return item.source === "occasion" ? "مناسبة" : "طوال اليوم";
}

function getExternalCalendarLabel(item: DisplayCalendarItem) {
  if (item.source === "occasion") {
    return item.calendarName ? `مناسبة · ${item.calendarName}` : "مناسبة";
  }

  return item.calendarName
    ? `Google Calendar · ${item.calendarName}`
    : `Google Calendar · ${item.accountName ?? item.accountEmail}`;
}

function buildFetchWindow(view: ViewMode, selectedDate: Date) {
  if (view === "month") {
    const cells = buildMonthCells(selectedDate.getFullYear(), selectedDate.getMonth());
    const start = new Date(cells[0].date);
    const end = new Date(cells[cells.length - 1].date);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (view === "week") {
    const days = getWeekDays(selectedDate);
    const start = new Date(days[0]);
    const end = new Date(days[days.length - 1]);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);
    return { start, end };
  }

  const start = new Date(selectedDate);
  const end = new Date(selectedDate);
  start.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1);
  end.setHours(0, 0, 0, 0);
  return { start, end };
}

export default function CalendarPage() {
  const [view, setView] = React.useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [calendarState, setCalendarState] = React.useState<{
    status: CalendarLoadState;
    data: CalendarEventsResponse;
  }>({
    status: "loading",
    data: {
      configured: false,
      mode: "not_connected",
      accounts: [],
      events: [],
      errors: [],
    },
  });
  const buckets = useTasksStore((s) => s.buckets);
  const itemStatuses = useTasksStore((s) => s.itemStatuses);
  const fetchWindow = React.useMemo(
    () => (selectedDate ? buildFetchWindow(view, selectedDate) : null),
    [view, selectedDate]
  );

  React.useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  React.useEffect(() => {
    if (!fetchWindow) return;

    const controller = new AbortController();
    const activeWindow = fetchWindow;

    async function loadCalendarEvents() {
      setCalendarState((current) => ({ ...current, status: "loading" }));
      try {
        const params = new URLSearchParams({
          timeMin: activeWindow.start.toISOString(),
          timeMax: activeWindow.end.toISOString(),
        });
        const response = await fetch(`/api/calendar/events?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("calendar_fetch_failed");
        const data = (await response.json()) as CalendarEventsResponse;
        setCalendarState({ status: "ready", data });
      } catch (error) {
        if (controller.signal.aborted) return;
        setCalendarState((current) => ({
          status: "error",
          data: {
            ...current.data,
            errors: [
              {
                accountId: "app",
                email: "رتّبها",
                message: error instanceof Error ? error.message : "calendar_fetch_failed",
              },
            ],
          },
        }));
      }
    }

    void loadCalendarEvents();

    return () => controller.abort();
  }, [fetchWindow, refreshKey]);

  const eventMap = React.useMemo(
    () => buildEventMap(buckets, calendarState.data.events),
    [buckets, calendarState.data.events]
  );
  const weekDays = React.useMemo(
    () => (selectedDate ? getWeekDays(selectedDate) : []),
    [selectedDate]
  );
  const selectedEvents = selectedDate
    ? getEventsForDate(selectedDate, eventMap)
    : [];

  function move(amount: number) {
    setSelectedDate((date) => addToDate(date ?? new Date(), view, amount));
  }

  if (!selectedDate) {
    return (
      <AppShellMobile withBottomNav>
        <TopBar title="التقويم" showSettings />
        <div className="flex flex-col gap-4 px-4 pb-8 pt-3">
          <Card className="h-20 animate-pulse bg-muted/40" />
          <Card className="h-[520px] animate-pulse bg-muted/40" />
        </div>
        <BottomNav />
      </AppShellMobile>
    );
  }

  return (
    <AppShellMobile withBottomNav>
      <TopBar title="التقويم" showSettings />

      <div className="flex flex-col gap-4 px-4 pb-8 pt-3">
        <CalendarSyncCard
          state={calendarState}
          onRefresh={() => setRefreshKey((key) => key + 1)}
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="السابق"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-muted"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="min-w-0 text-center">
              <h2 className="truncate text-[17px] font-bold">
                {getHeaderTitle(view, selectedDate)}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedDate(new Date())}
                className="mt-1 text-[12px] font-semibold text-primary-700"
              >
                اليوم
              </button>
            </div>

            <button
              type="button"
              onClick={() => move(1)}
              aria-label="التالي"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 rounded-chip border border-border bg-surface p-1 shadow-card">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setView(mode.id)}
                className={cn(
                  "h-9 rounded-chip text-[13px] font-semibold transition-colors",
                  view === mode.id
                    ? "bg-primary-500 text-white shadow-card"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <CalendarLegend />
        </div>

        {view === "day" && (
          <DayTimeline
            date={selectedDate}
            items={selectedEvents}
            itemStatuses={itemStatuses}
          />
        )}

        {view === "week" && (
          <WeekTimeline
            days={weekDays}
            eventMap={eventMap}
            itemStatuses={itemStatuses}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
        )}

        {view === "month" && (
          <>
            <MonthGrid
              year={selectedDate.getFullYear()}
              month={selectedDate.getMonth()}
              eventMap={eventMap}
              itemStatuses={itemStatuses}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
            <AgendaList
              date={selectedDate}
              items={selectedEvents}
              itemStatuses={itemStatuses}
            />
          </>
        )}
      </div>

      <BottomNav />
    </AppShellMobile>
  );
}

function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-secondary-400" />
        مهام
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-sky-400" />
        Google
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        مناسبات
      </span>
    </div>
  );
}

function CalendarSyncCard({
  state,
  onRefresh,
}: {
  state: { status: CalendarLoadState; data: CalendarEventsResponse };
  onRefresh: () => void;
}) {
  const { status, data } = state;
  const isLoading = status === "loading";
  const connectedCount = data.accounts.length;

  if (!data.configured) {
    return (
      <Card className="border-danger/20 bg-red-50/70">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold">Google Calendar غير مهيأ</p>
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
              أضف مفاتيح Google OAuth على السيرفر حتى تظهر أحداث حساباتك هنا.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/connect-calendar">الإعداد</Link>
          </Button>
        </div>
      </Card>
    );
  }

  if (data.mode === "not_connected") {
    return (
      <Card className="border-primary-100 bg-primary-50/35">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[14px] font-bold">اربط تقويمك الحقيقي</p>
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
              بعد الربط ستظهر أحداث Google والمناسبات بجانب مهام رتّبها.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/connect-calendar">ربط</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-bold">
            {connectedCount > 1
              ? `متصل بـ ${connectedCount} حسابات Google`
              : "متصل بحساب Google"}
          </p>
          <p className="mt-1 truncate text-[12px] text-muted-foreground">
            {data.accounts.map((account) => account.email).join("، ")}
          </p>
          {data.errors.length > 0 && (
            <p className="mt-2 text-[12px] text-danger">
              تعذر تحديث كل التقويمات في {data.errors.length} حساب. أعد الربط إذا لم تظهر المناسبات.
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="تحديث التقويم"
            disabled={isLoading}
            onClick={onRefresh}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/connect-calendar">الحسابات</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MonthGrid({
  year,
  month,
  eventMap,
  itemStatuses,
  selectedDate,
  onSelect,
}: {
  year: number;
  month: number;
  eventMap: Map<string, DisplayCalendarItem[]>;
  itemStatuses: Record<string, PillStatus>;
  selectedDate: Date;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  const cells = React.useMemo(() => buildMonthCells(year, month), [year, month]);

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center">
        {AR_DAYS.map((day) => (
          <span
            key={day}
            className="py-2 text-[10px] font-semibold text-muted-foreground"
          >
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const events = getEventsForDate(cell.date, eventMap);
          const isToday = isSameDay(cell.date, today);
          const isSelected = isSameDay(cell.date, selectedDate);

          return (
            <button
              key={cell.date.toISOString()}
              type="button"
              onClick={() => onSelect(cell.date)}
              className={cn(
                "min-h-[82px] border-b border-s border-border/70 p-1.5 text-start transition-colors",
                !cell.inCurrentMonth && "bg-muted/20 text-muted-foreground/60",
                isSelected && "bg-primary-50",
                !isSelected && "hover:bg-muted/50"
              )}
            >
              <span
                className={cn(
                  "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold",
                  isToday && "bg-primary-500 text-white",
                  isSelected && !isToday && "bg-primary-100 text-primary-800"
                )}
              >
                {cell.date.getDate()}
              </span>

              <div className="flex flex-col gap-1">
                {events.slice(0, 2).map((item) => (
                  <span
                    key={item.id}
                    className={cn(
                      "block truncate rounded-[6px] border px-1 py-0.5 text-[9px] font-semibold leading-tight",
                      getEventClasses(item, getItemStatus(item, itemStatuses))
                    )}
                  >
                    {item.isAllDay ? getAllDayPrefix(item) : formatClock(new Date(item.start_time))}{" "}
                    {item.title}
                  </span>
                ))}
                {events.length > 2 && (
                  <span className="text-[9px] font-semibold text-muted-foreground">
                    +{events.length - 2}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekTimeline({
  days,
  eventMap,
  itemStatuses,
  selectedDate,
  onSelect,
}: {
  days: Date[];
  eventMap: Map<string, DisplayCalendarItem[]>;
  itemStatuses: Record<string, PillStatus>;
  selectedDate: Date;
  onSelect: (d: Date) => void;
}) {
  const height = HOURS.length * HOUR_HEIGHT;
  const today = new Date();

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[52px_repeat(7,minmax(96px,1fr))] border-b border-border bg-muted/40">
            <div />
            {days.map((day) => {
              const isToday = isSameDay(day, today);
              const isSelected = isSameDay(day, selectedDate);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => onSelect(day)}
                  className="flex flex-col items-center gap-1 py-2"
                >
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {AR_DAYS[day.getDay()]}
                  </span>
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-bold",
                      isSelected && "bg-primary-500 text-white",
                      !isSelected && isToday && "bg-primary-100 text-primary-800"
                    )}
                  >
                    {day.getDate()}
                  </span>
                </button>
              );
            })}
          </div>

          <AllDayWeekRow days={days} eventMap={eventMap} itemStatuses={itemStatuses} />

          <div className="relative" style={{ height }}>
            {HOURS.map((hour, index) => (
              <div
                key={hour}
                className="absolute inset-x-0 border-t border-border/60"
                style={{ top: index * HOUR_HEIGHT }}
              >
                <span className="absolute start-1 top-1 w-11 text-center text-[10px] text-muted-foreground">
                  {formatHour(hour)}
                </span>
              </div>
            ))}

            <div className="absolute inset-y-0 start-[52px] end-0 grid grid-cols-7">
              {days.map((day) => {
                const events = getEventsForDate(day, eventMap).filter(
                  (item) => !item.isAllDay
                );
                return (
                  <div
                    key={day.toISOString()}
                    className="relative border-s border-border/70 px-1"
                  >
                    {events.map((item) => (
                      <CalendarBlock
                        key={item.id}
                        item={item}
                        status={getItemStatus(item, itemStatuses)}
                        compact
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AllDayWeekRow({
  days,
  eventMap,
  itemStatuses,
}: {
  days: Date[];
  eventMap: Map<string, DisplayCalendarItem[]>;
  itemStatuses: Record<string, PillStatus>;
}) {
  const hasAllDay = days.some((day) =>
    getEventsForDate(day, eventMap).some((item) => item.isAllDay)
  );

  if (!hasAllDay) return null;

  return (
    <div className="grid grid-cols-[52px_repeat(7,minmax(96px,1fr))] border-b border-border bg-surface">
      <div className="px-1 py-2 text-center text-[10px] text-muted-foreground">
        طوال اليوم
      </div>
      {days.map((day) => {
        const events = getEventsForDate(day, eventMap).filter((item) => item.isAllDay);
        return (
          <div key={day.toISOString()} className="border-s border-border/70 p-1">
            <div className="flex flex-col gap-1">
              {events.map((item) => (
                <span
                  key={item.id}
                  className={cn(
                    "truncate rounded-[6px] border px-1.5 py-1 text-[10px] font-semibold",
                    getEventClasses(item, getItemStatus(item, itemStatuses))
                  )}
                >
                  {item.title}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayTimeline({
  date,
  items,
  itemStatuses,
}: {
  date: Date;
  items: DisplayCalendarItem[];
  itemStatuses: Record<string, PillStatus>;
}) {
  const height = HOURS.length * HOUR_HEIGHT;
  const allDayItems = items.filter((item) => item.isAllDay);
  const timedItems = items.filter((item) => !item.isAllDay);
  const allDayTitle = allDayItems.some((item) => item.source === "occasion")
    ? "مناسبات اليوم"
    : "طوال اليوم";

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary-600" />
          <span className="text-[14px] font-bold">
            {isSameDay(date, new Date()) ? "اليوم" : arabicWeekday(date)}
          </span>
        </div>
        <span className="text-[12px] font-semibold text-muted-foreground">
          {items.length} حدث
        </span>
      </div>

      {allDayItems.length > 0 && (
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3">
          <span className="text-[11px] font-semibold text-muted-foreground">
            {allDayTitle}
          </span>
          {allDayItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "rounded-[8px] border px-3 py-2 text-[13px] font-semibold",
                getEventClasses(item, getItemStatus(item, itemStatuses))
              )}
            >
              {item.title}
            </div>
          ))}
        </div>
      )}

      <div className="relative" style={{ height }}>
        {HOURS.map((hour, index) => (
          <div
            key={hour}
            className="absolute inset-x-0 border-t border-border/60"
            style={{ top: index * HOUR_HEIGHT }}
          >
            <span className="absolute start-1 top-1 w-11 text-center text-[10px] text-muted-foreground">
              {formatHour(hour)}
            </span>
          </div>
        ))}

        <div className="absolute inset-y-0 start-[52px] end-0 border-s border-border/70">
          {timedItems.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-[13px] text-muted-foreground">
              لا توجد أحداث بوقت محدد في هذا اليوم
            </div>
          ) : (
            timedItems.map((item) => (
              <CalendarBlock
                key={item.id}
                item={item}
                status={getItemStatus(item, itemStatuses)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CalendarBlock({
  item,
  status,
  compact,
}: {
  item: DisplayCalendarItem;
  status: PillStatus;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute inset-x-1 overflow-hidden rounded-[8px] border px-2 py-1 shadow-sm",
        getEventClasses(item, status)
      )}
      style={getBlockStyle(item)}
    >
      <p
        className={cn(
          "truncate font-bold leading-tight",
          compact ? "text-[10px]" : "text-[13px]"
        )}
      >
        {item.title}
      </p>
      <p className={cn("mt-0.5 truncate opacity-80", compact ? "text-[9px]" : "text-[11px]")}>
        {compact
          ? formatClock(new Date(item.start_time))
          : formatTimeRange(item.start_time, item.end_time)}
      </p>
      {!compact && item.source !== "ratbha" && (
        <p className="mt-0.5 truncate text-[10px] opacity-75">
          {getExternalCalendarLabel(item)}
        </p>
      )}
    </div>
  );
}

function AgendaList({
  date,
  items,
  itemStatuses,
}: {
  date: Date;
  items: DisplayCalendarItem[];
  itemStatuses: Record<string, PillStatus>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[14px] font-semibold">
        {isSameDay(date, new Date())
          ? "أحداث اليوم"
          : `${arabicWeekday(date)} ${date.getDate()} ${AR_MONTHS[date.getMonth()]}`}
      </h3>

      {items.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-surface px-4 py-6 text-center text-[13px] text-muted-foreground">
          لا توجد أحداث في هذا اليوم
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold">{item.title}</p>
              <p className="mt-1 flex items-center gap-1 text-[12px] text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                {item.isAllDay
                  ? getAllDayPrefix(item)
                  : formatTimeRange(item.start_time, item.end_time)}
              </p>
              {item.source !== "ratbha" && (
                <p
                  className={cn(
                    "mt-1 truncate text-[11px]",
                    item.source === "occasion" ? "text-amber-700" : "text-sky-700"
                  )}
                >
                  {getExternalCalendarLabel(item)}
                </p>
              )}
            </div>
            <StatusPill status={getItemStatus(item, itemStatuses)} />
          </div>
        ))
      )}
    </div>
  );
}
