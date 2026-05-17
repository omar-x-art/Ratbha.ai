"use client";

import * as React from "react";
import { CalendarDays, CalendarPlus, Check, Clock, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatTimeRange } from "@/lib/utils";
import {
  getUpcomingSourceLabel,
  type UpcomingEntry,
} from "@/lib/calendar/upcoming";

interface NextTaskWidgetProps {
  item?: UpcomingEntry | null;
  onDone?: () => void;
  onReorganize?: () => void;
  onOpenCalendar?: () => void;
}

export function NextTaskWidget({
  item,
  onDone,
  onReorganize,
  onOpenCalendar,
}: NextTaskWidgetProps) {
  if (!item) {
    return (
      <Card className="overflow-hidden border-dashed bg-surface p-0 shadow-none">
        <div className="flex items-center gap-3 px-3 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-sky-50 text-sky-700">
            <CalendarPlus className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-bold">لا توجد مهمة قادمة</p>
            <p className="text-[12px] text-muted-foreground">
              أضف مهمة بوقت واضح لتظهر هنا.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const isTask = item.source === "task";
  const sourceLabel = getUpcomingSourceLabel(item);

  return (
    <Card className="relative overflow-hidden border-border bg-surface p-0 shadow-card">
      <span className="absolute inset-y-3 start-0 w-1 rounded-e-full bg-sky-500" />
      <div className="px-3 py-3 ps-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-[7px] bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-900">
                التالية
              </span>
              <span className="flex items-center gap-1 text-[12px] font-semibold text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatTimeRange(item.start_time, item.end_time)}
              </span>
            </div>
            <h2 className="line-clamp-2 text-[17px] font-bold leading-snug">
              {item.title}
            </h2>
            <p className="mt-1 truncate text-[11px] font-semibold text-muted-foreground">
              {sourceLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={isTask ? onDone : onOpenCalendar}
            aria-label={isTask ? "إنجاز المهمة" : "فتح التقويم"}
            className={
              isTask
                ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-emerald-500 text-white shadow-card transition-colors hover:bg-emerald-600 disabled:opacity-50"
                : "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-sky-500 text-white shadow-card transition-colors hover:bg-sky-600 disabled:opacity-50"
            }
            disabled={isTask ? !onDone : !onOpenCalendar}
          >
            {isTask ? (
              <Check className="h-4 w-4" />
            ) : (
              <CalendarDays className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mt-3">
          <Button
            variant="outline"
            onClick={isTask ? onReorganize : onOpenCalendar}
            className="h-8 w-full justify-center rounded-[9px] text-[12px]"
            size="sm"
            disabled={isTask ? !onReorganize : !onOpenCalendar}
          >
            {isTask ? (
              <>
                <Pencil className="h-3.5 w-3.5" />
                تعديل المهمة
              </>
            ) : (
              <>
                <CalendarDays className="h-3.5 w-3.5" />
                فتح التقويم
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
