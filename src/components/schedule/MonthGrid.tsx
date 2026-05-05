"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { startOfArabicWeek, type GridEvent } from "./WeekGrid";

interface MonthGridProps {
  events: GridEvent[];
  /** Any date inside the month to display. */
  referenceDate: Date;
  onDayClick?: (date: Date) => void;
}

const ARABIC_WEEKDAY_SHORT = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];
const ARABIC_MONTH = new Intl.DateTimeFormat("ar-EG", {
  month: "long",
  year: "numeric",
});

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** First day of the month containing `d`. */
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Last day of the month containing `d`. */
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function MonthGrid({
  events,
  referenceDate,
  onDayClick,
}: MonthGridProps) {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const gridStart = startOfArabicWeek(monthStart);

  // 6 weeks × 7 days = 42 cells, enough for any month.
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const ev of events) {
      const key = ymd(new Date(ev.start));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [events]);

  const today = ymd(startOfDay(new Date()));

  return (
    <div className="rounded-card border border-border bg-surface p-3 shadow-card">
      <div className="mb-2 text-center text-[14px] font-semibold">
        {ARABIC_MONTH.format(referenceDate)}
      </div>

      <div className="grid grid-cols-7 border-b border-border pb-1">
        {ARABIC_WEEKDAY_SHORT.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {cells.map((d) => {
          const key = ymd(d);
          const inMonth =
            d.getMonth() === referenceDate.getMonth() &&
            d.getFullYear() === referenceDate.getFullYear();
          const isToday = key === today;
          const count = counts.get(key) ?? 0;
          const dotCount = Math.min(count, 3);
          const isPast =
            d.getTime() < startOfDay(new Date()).getTime() &&
            !isToday &&
            d >= monthStart &&
            d <= monthEnd;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick?.(d)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md text-[12px] transition-colors",
                inMonth ? "text-foreground" : "text-muted-foreground/40",
                isToday && "bg-primary-50 font-bold text-primary-700",
                !isToday && inMonth && "hover:bg-muted/50",
                isPast && "opacity-70"
              )}
            >
              <span className="leading-none">{d.getDate()}</span>
              {count > 0 && (
                <div className="flex gap-0.5">
                  {Array.from({ length: dotCount }, (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1 w-1 rounded-full",
                        isToday ? "bg-primary-700" : "bg-primary-500"
                      )}
                    />
                  ))}
                  {count > 3 && (
                    <span className="text-[8px] leading-none text-primary-700">
                      +
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
