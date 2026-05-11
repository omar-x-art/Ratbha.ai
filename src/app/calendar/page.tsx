"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  LayoutGrid,
} from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { BottomNav } from "@/components/shell/BottomNav";
import { StatusPill } from "@/components/plan/StatusPill";
import { cn, arabicWeekday } from "@/lib/utils";
import { MOCK_PLAN } from "@/lib/mock/plans";
import type { PlanItem } from "@/lib/types";

type ViewMode = "month" | "week";

const AR_DAYS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const AR_MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
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
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function buildEventMap(): Map<string, PlanItem[]> {
  const map = new Map<string, PlanItem[]>();
  for (const bucket of MOCK_PLAN.buckets) {
    for (const item of bucket.items) {
      const start = new Date(item.start_time);
      const key = `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`;
      const arr = map.get(key) || [];
      arr.push(item);
      map.set(key, arr);
    }
  }
  return map;
}

export default function CalendarPage() {
  const [view, setView] = React.useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const eventMap = React.useMemo(() => buildEventMap(), []);

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();

  function prev() {
    setSelectedDate((d) => {
      const next = new Date(d);
      if (view === "month") next.setMonth(next.getMonth() - 1);
      else next.setDate(next.getDate() - 7);
      return next;
    });
  }

  function next() {
    setSelectedDate((d) => {
      const next = new Date(d);
      if (view === "month") next.setMonth(next.getMonth() + 1);
      else next.setDate(next.getDate() + 7);
      return next;
    });
  }

  function goToToday() {
    setSelectedDate(new Date());
  }

  const weekDays = getWeekDays(selectedDate);
  const selectedKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
  const selectedEvents = eventMap.get(selectedKey) || [];

  return (
    <AppShellMobile withBottomNav>
      <TopBar title="التقويم" showSettings />

      <div className="flex flex-col gap-4 px-4 pb-8 pt-3">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <h2 className="text-[16px] font-bold">
              {view === "month"
                ? `${AR_MONTHS[currentMonth]} ${currentYear}`
                : `${AR_MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getDate()} – ${weekDays[6].getDate()}`}
            </h2>
            <button
              onClick={next}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="rounded-chip bg-primary-50 px-3 py-1 text-[12px] font-semibold text-primary-700 hover:bg-primary-100"
            >
              اليوم
            </button>
            <button
              onClick={() => setView(view === "month" ? "week" : "month")}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
            >
              {view === "month" ? (
                <LayoutGrid className="h-4 w-4" />
              ) : (
                <CalendarIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {AR_DAYS.map((d) => (
            <span
              key={d}
              className="text-[11px] font-semibold text-muted-foreground"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Month view */}
        {view === "month" && (
          <MonthGrid
            year={currentYear}
            month={currentMonth}
            eventMap={eventMap}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
        )}

        {/* Week view */}
        {view === "week" && (
          <WeekGrid
            days={weekDays}
            eventMap={eventMap}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
        )}

        {/* Selected day events */}
        <div className="flex flex-col gap-2">
          <h3 className="text-[14px] font-semibold">
            {isSameDay(selectedDate, new Date())
              ? "اليوم"
              : arabicWeekday(selectedDate) +
                " " +
                selectedDate.getDate() +
                " " +
                AR_MONTHS[selectedDate.getMonth()]}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-muted-foreground">
              لا توجد أحداث في هذا اليوم
            </p>
          ) : (
            selectedEvents.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-card border border-border bg-surface p-3"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[14px] font-semibold">{item.title}</span>
                  <span className="text-[12px] text-muted-foreground">
                    {new Date(item.start_time).toLocaleTimeString("ar-EG", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {new Date(item.end_time).toLocaleTimeString("ar-EG", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <StatusPill
                  status={
                    item.is_locked ? "active" : "planned"
                  }
                />
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </AppShellMobile>
  );
}

function MonthGrid({
  year,
  month,
  eventMap,
  selectedDate,
  onSelect,
}: {
  year: number;
  month: number;
  eventMap: Map<string, PlanItem[]>;
  selectedDate: Date;
  onSelect: (d: Date) => void;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const cells: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="grid grid-cols-7 gap-1">
      {cells.map((day, i) => {
        if (day === null) return <div key={`e-${i}`} className="h-10" />;

        const date = new Date(year, month, day);
        const key = `${year}-${month}-${day}`;
        const events = eventMap.get(key);
        const isToday = isSameDay(date, today);
        const isSelected = isSameDay(date, selectedDate);

        return (
          <button
            key={day}
            onClick={() => onSelect(date)}
            className={cn(
              "flex h-10 flex-col items-center justify-center rounded-card text-[14px] transition-colors",
              isSelected && "bg-primary-500 text-white font-bold",
              !isSelected && isToday && "bg-primary-50 text-primary-700 font-semibold",
              !isSelected && !isToday && "hover:bg-muted"
            )}
          >
            <span>{day}</span>
            {events && events.length > 0 && (
              <div className="flex gap-0.5">
                {events.slice(0, 3).map((_, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      "h-1 w-1 rounded-full",
                      isSelected ? "bg-white" : "bg-primary-500"
                    )}
                  />
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function WeekGrid({
  days,
  eventMap,
  selectedDate,
  onSelect,
}: {
  days: Date[];
  eventMap: Map<string, PlanItem[]>;
  selectedDate: Date;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-border pb-1">
          <div />
          {days.map((d) => {
            const isToday = isSameDay(d, today);
            const isSelected = isSameDay(d, selectedDate);
            return (
              <button
                key={d.toISOString()}
                onClick={() => onSelect(d)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg py-1 text-[11px]",
                  isSelected && "bg-primary-500 text-white",
                  !isSelected && isToday && "bg-primary-50 text-primary-700 font-semibold",
                  !isSelected && !isToday && "hover:bg-muted"
                )}
              >
                <span>{AR_DAYS[d.getDay()]}</span>
                <span className="text-[13px] font-bold">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        {/* Hour rows */}
        <div className="relative">
          {hours.map((h) => (
            <div key={h} className="grid grid-cols-8 border-b border-border/50">
              <span className="flex items-start justify-end px-1 py-1 text-[10px] text-muted-foreground">
                {h > 12 ? h - 12 : h}{h >= 12 ? "م" : "ص"}
              </span>
              {days.map((d) => {
                const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                const events = (eventMap.get(key) || []).filter((item) => {
                  const startHour = new Date(item.start_time).getHours();
                  return startHour === h;
                });

                return (
                  <div
                    key={d.toISOString() + h}
                    className="relative min-h-[32px] border-s border-border/30"
                  >
                    {events.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded px-1 py-0.5 text-[9px] font-semibold",
                          item.is_locked
                            ? "bg-primary-100 text-primary-800"
                            : "bg-secondary-100 text-secondary-800"
                        )}
                      >
                        {item.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
