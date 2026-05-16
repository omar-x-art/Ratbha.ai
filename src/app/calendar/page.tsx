"use client";

import * as React from "react";
import { CalendarClock, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { BottomNav } from "@/components/shell/BottomNav";
import { StatusPill } from "@/components/plan/StatusPill";
import { arabicWeekday, cn, formatTimeRange } from "@/lib/utils";
import { useTasksStore } from "@/lib/store/tasks-store";
import type { DayBucket, PillStatus, PlanItem } from "@/lib/types";

type ViewMode = "day" | "week" | "month";

interface CalendarCell {
  date: Date;
  inCurrentMonth: boolean;
}

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

function buildEventMap(buckets: DayBucket[]): Map<string, PlanItem[]> {
  const map = new Map<string, PlanItem[]>();

  buckets.forEach((bucket) => {
    bucket.items.forEach((item) => {
      const key = dateKey(new Date(item.start_time));
      map.set(key, [...(map.get(key) ?? []), item]);
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

function getEventsForDate(date: Date, eventMap: Map<string, PlanItem[]>) {
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
  item: PlanItem,
  itemStatuses: Record<string, PillStatus>
): PillStatus {
  if (itemStatuses[item.id]) return itemStatuses[item.id];
  if (item.is_locked) return "active";
  return "planned";
}

function getBlockStyle(item: PlanItem): React.CSSProperties {
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

function getEventClasses(item: PlanItem, status: PillStatus) {
  if (status === "done") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "overdue") return "border-red-200 bg-red-50 text-red-800";
  if (item.is_locked || item.item_type === "existing_event") {
    return "border-primary-200 bg-primary-50 text-primary-800";
  }
  return "border-secondary-200 bg-secondary-50 text-secondary-800";
}

export default function CalendarPage() {
  const [view, setView] = React.useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const buckets = useTasksStore((s) => s.buckets);
  const itemStatuses = useTasksStore((s) => s.itemStatuses);
  const eventMap = React.useMemo(() => buildEventMap(buckets), [buckets]);
  const weekDays = React.useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const selectedEvents = getEventsForDate(selectedDate, eventMap);

  function move(amount: number) {
    setSelectedDate((date) => addToDate(date, view, amount));
  }

  return (
    <AppShellMobile withBottomNav>
      <TopBar title="التقويم" showSettings />

      <div className="flex flex-col gap-4 px-4 pb-8 pt-3">
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
  eventMap: Map<string, PlanItem[]>;
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
                    {formatClock(new Date(item.start_time))} {item.title}
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
  eventMap: Map<string, PlanItem[]>;
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
                const events = getEventsForDate(day, eventMap);
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

function DayTimeline({
  date,
  items,
  itemStatuses,
}: {
  date: Date;
  items: PlanItem[];
  itemStatuses: Record<string, PillStatus>;
}) {
  const height = HOURS.length * HOUR_HEIGHT;

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
          {items.length} مهام
        </span>
      </div>

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
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-[13px] text-muted-foreground">
              لا توجد مهام في هذا اليوم
            </div>
          ) : (
            items.map((item) => (
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
  item: PlanItem;
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
      <p className={cn("mt-0.5 opacity-80", compact ? "text-[9px]" : "text-[11px]")}>
        {compact
          ? formatClock(new Date(item.start_time))
          : formatTimeRange(item.start_time, item.end_time)}
      </p>
    </div>
  );
}

function AgendaList({
  date,
  items,
  itemStatuses,
}: {
  date: Date;
  items: PlanItem[];
  itemStatuses: Record<string, PillStatus>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[14px] font-semibold">
        {isSameDay(date, new Date())
          ? "مهام اليوم"
          : `${arabicWeekday(date)} ${date.getDate()} ${AR_MONTHS[date.getMonth()]}`}
      </h3>

      {items.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-surface px-4 py-6 text-center text-[13px] text-muted-foreground">
          لا توجد مهام في هذا اليوم
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
                {formatTimeRange(item.start_time, item.end_time)}
              </p>
            </div>
            <StatusPill status={getItemStatus(item, itemStatuses)} />
          </div>
        ))
      )}
    </div>
  );
}
