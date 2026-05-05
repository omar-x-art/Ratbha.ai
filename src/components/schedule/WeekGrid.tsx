"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface GridEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isMeeting?: boolean;
}

interface WeekGridProps {
  events: GridEvent[];
  /** Reference date — picks the Saturday-Friday week that contains it. */
  referenceDate: Date;
  onEventClick?: (event: GridEvent) => void;
  onDayClick?: (date: Date) => void;
}

const ARABIC_WEEKDAY_SHORT = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

const ARABIC_TIME = new Intl.DateTimeFormat("ar-EG", {
  hour: "numeric",
  minute: "2-digit",
});

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Saturday-anchored start of week (Arabic convention). */
export function startOfArabicWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // 0=Sun..6=Sat
  const daysBack = (day + 1) % 7;
  x.setDate(x.getDate() - daysBack);
  return x;
}

export function WeekGrid({
  events,
  referenceDate,
  onEventClick,
  onDayClick,
}: WeekGridProps) {
  const weekStart = startOfArabicWeek(referenceDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, GridEvent[]>();
    for (const ev of events) {
      const key = ymd(new Date(ev.start));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    for (const list of Array.from(map.values())) {
      list.sort(
        (a, b) =>
          new Date(a.start).getTime() - new Date(b.start).getTime()
      );
    }
    return map;
  }, [events]);

  const today = ymd(new Date());

  return (
    <div className="rounded-card border border-border bg-surface shadow-card">
      <div className="grid grid-cols-7 border-b border-border">
        {days.map((d) => {
          const key = ymd(d);
          const isToday = key === today;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick?.(d)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-center transition-colors",
                isToday
                  ? "bg-primary-50 text-primary-700"
                  : "text-muted-foreground hover:bg-muted/40"
              )}
            >
              <span className="text-[10px] font-medium leading-none">
                {ARABIC_WEEKDAY_SHORT[d.getDay() === 6 ? 0 : d.getDay() + 1]}
              </span>
              <span
                className={cn(
                  "text-[14px] font-bold leading-none",
                  isToday && "text-primary-700"
                )}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-7 min-h-[240px]">
        {days.map((d) => {
          const key = ymd(d);
          const dayEvents = eventsByDay.get(key) ?? [];
          const isToday = key === today;
          return (
            <div
              key={key}
              className={cn(
                "flex flex-col gap-1 border-l border-border p-1 last:border-l-0",
                isToday && "bg-primary-50/30"
              )}
            >
              {dayEvents.length === 0 && (
                <span className="mt-2 text-center text-[10px] text-muted-foreground/60">
                  —
                </span>
              )}
              {dayEvents.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onEventClick?.(ev)}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-md px-1.5 py-1 text-right text-[10px] leading-tight transition-colors",
                    ev.isMeeting
                      ? "bg-secondary-50 text-secondary-700 hover:bg-secondary-100"
                      : "bg-primary-100 text-primary-700 hover:bg-primary-200"
                  )}
                >
                  <span className="line-clamp-2 font-medium">{ev.title}</span>
                  <span className="text-[9px] opacity-70">
                    {ARABIC_TIME.format(new Date(ev.start))}
                  </span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
