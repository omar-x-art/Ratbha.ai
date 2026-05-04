"use client";

import * as React from "react";
import { Lock, Pencil } from "lucide-react";
import { cn, formatTimeRange } from "@/lib/utils";
import type { PlanItem } from "@/lib/types";

interface TaskItemProps {
  item: PlanItem;
  onEdit?: (item: PlanItem) => void;
  className?: string;
}

export function TaskItem({ item, onEdit, className }: TaskItemProps) {
  const isFixed = item.item_type === "existing_event" || item.is_locked;
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-card border border-border bg-surface p-3 shadow-card",
        className
      )}
    >
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          {isFixed && (
            <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          )}
          <span className="text-[15px] font-semibold leading-snug">
            {item.title}
          </span>
        </div>
        <span className="text-[13px] text-muted-foreground">
          {formatTimeRange(item.start_time, item.end_time)}
        </span>
        {item.reason && (
          <span className="text-[12px] text-muted-foreground/80">
            {item.reason}
          </span>
        )}
      </div>

      {!isFixed && (
        <button
          type="button"
          onClick={() => onEdit?.(item)}
          aria-label="تعديل"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      {isFixed && (
        <span className="self-start rounded-chip bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          ثابت
        </span>
      )}
    </div>
  );
}
