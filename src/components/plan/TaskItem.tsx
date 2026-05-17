"use client";

import * as React from "react";
import { CalendarOff, MoreVertical } from "lucide-react";
import { cn, formatTimeRange } from "@/lib/utils";
import { StatusPill } from "@/components/plan/StatusPill";
import { shouldShowTaskInCalendar } from "@/lib/calendar/upcoming";
import type { PillStatus, PlanItem } from "@/lib/types";

interface TaskItemProps {
  item: PlanItem;
  pillStatus?: PillStatus;
  onEdit?: (item: PlanItem) => void;
  onStatusClick?: (item: PlanItem) => void;
  onActionsClick?: (item: PlanItem) => void;
  className?: string;
}

function getPillStatus(item: PlanItem): PillStatus {
  if (item.item_type === "existing_event" || item.is_locked) return "active";
  const now = Date.now();
  const start = new Date(item.start_time).getTime();
  if (start < now) return "overdue";
  return "planned";
}

export function TaskItem({
  item,
  pillStatus,
  onEdit,
  onStatusClick,
  onActionsClick,
  className,
}: TaskItemProps) {
  const isFixed = item.item_type === "existing_event" || item.is_locked;
  const status = pillStatus ?? getPillStatus(item);

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-card border border-border bg-surface p-3 shadow-card transition-colors",
        isFixed && "border-primary-100 bg-primary-50/30",
        className
      )}
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <StatusPill
            status={status}
            onClick={onStatusClick ? () => onStatusClick(item) : undefined}
          />
          <span className="text-[15px] font-semibold leading-snug">
            {item.title}
          </span>
        </div>
        <span className="text-[13px] text-muted-foreground">
          {formatTimeRange(item.start_time, item.end_time)}
        </span>
        {!shouldShowTaskInCalendar(item) && (
          <span className="inline-flex w-fit items-center gap-1 rounded-[7px] bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
            <CalendarOff className="h-3 w-3" />
            مهام فقط
          </span>
        )}
        {item.reason && (
          <span className="text-[12px] text-muted-foreground/80">
            {item.reason}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {onActionsClick && (
          <button
            type="button"
            onClick={() => onActionsClick(item)}
            aria-label="إجراءات"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        )}
        {onEdit && !onActionsClick && (
          <button
            type="button"
            onClick={() => onEdit(item)}
            aria-label="تعديل"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
