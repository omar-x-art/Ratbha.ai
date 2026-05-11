"use client";

import * as React from "react";
import { Check, Trash2, MoreVertical } from "lucide-react";
import { cn, formatTimeRange } from "@/lib/utils";
import { StatusPill, type PillStatus } from "@/components/plan/StatusPill";
import type { PlanItem } from "@/lib/types";

interface SwipeableTaskItemProps {
  item: PlanItem;
  pillStatus?: PillStatus;
  onDone?: (item: PlanItem) => void;
  onDelete?: (item: PlanItem) => void;
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

export function SwipeableTaskItem({
  item,
  pillStatus,
  onDone,
  onDelete,
  onStatusClick,
  onActionsClick,
  className,
}: SwipeableTaskItemProps) {
  const [offsetX, setOffsetX] = React.useState(0);
  const startXRef = React.useRef(0);
  const currentXRef = React.useRef(0);
  const isDragging = React.useRef(false);

  const status = pillStatus ?? getPillStatus(item);
  const THRESHOLD = 80;

  function handleTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = offsetX;
    isDragging.current = true;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging.current) return;
    const diff = e.touches[0].clientX - startXRef.current;
    const newOffset = Math.max(-120, Math.min(120, currentXRef.current + diff));
    setOffsetX(newOffset);
  }

  function handleTouchEnd() {
    isDragging.current = false;
    if (offsetX > THRESHOLD) {
      onDone?.(item);
      setOffsetX(0);
    } else if (offsetX < -THRESHOLD) {
      onDelete?.(item);
      setOffsetX(0);
    } else {
      setOffsetX(0);
    }
  }

  const showDoneAction = offsetX > 20 && onDone;
  const showDeleteAction = offsetX < -20 && onDelete;

  return (
    <div className={cn("relative overflow-hidden rounded-card", className)}>
      {/* Background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <div
          className={cn(
            "flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-white transition-opacity",
            showDoneAction ? "opacity-100" : "opacity-0"
          )}
        >
          <Check className="h-4 w-4" />
          <span className="text-[12px] font-semibold">تم</span>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-full bg-danger px-3 py-1.5 text-white transition-opacity",
            showDeleteAction ? "opacity-100" : "opacity-0"
          )}
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-[12px] font-semibold">حذف</span>
        </div>
      </div>

      {/* Foreground card */}
      <div
        className={cn(
          "relative flex items-start justify-between gap-3 border-b border-border bg-surface p-3 transition-shadow",
          Math.abs(offsetX) > 10 && "shadow-lg"
        )}
        style={{
          transform: `translateX(${-offsetX}px)`,
          transition: isDragging.current ? "none" : "transform 200ms ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
          {item.reason && (
            <span className="text-[12px] text-muted-foreground/80">
              {item.reason}
            </span>
          )}
        </div>

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
      </div>
    </div>
  );
}
