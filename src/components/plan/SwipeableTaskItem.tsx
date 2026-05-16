"use client";

import * as React from "react";
import { Check, Trash2, MoreVertical, Clock3 } from "lucide-react";
import { cn, formatTimeRange } from "@/lib/utils";
import { StatusPill } from "@/components/plan/StatusPill";
import type { PillStatus, PlanItem } from "@/lib/types";

interface SwipeableTaskItemProps {
  item: PlanItem;
  pillStatus?: PillStatus;
  onDone?: (item: PlanItem) => void;
  onDelete?: (item: PlanItem) => void;
  onStatusClick?: (item: PlanItem) => void;
  onActionsClick?: (item: PlanItem) => void;
  className?: string;
}

const STATUS_MARKER: Record<PillStatus, string> = {
  active: "bg-amber-400",
  done: "bg-emerald-500",
  overdue: "bg-rose-500",
  planned: "bg-sky-500",
  inbox: "bg-violet-500",
};

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
  const [isDragging, setIsDragging] = React.useState(false);
  const startPointRef = React.useRef({ x: 0, y: 0 });
  const originOffsetRef = React.useRef(0);
  const offsetRef = React.useRef(0);
  const intentRef = React.useRef<"idle" | "horizontal" | "vertical">("idle");
  const pointerIdRef = React.useRef<number | null>(null);
  const completionTimerRef = React.useRef<number | null>(null);

  const status = pillStatus ?? getPillStatus(item);
  const ACTION_THRESHOLD = 64;
  const ACTION_REVEAL = 104;
  const ACTION_LIMIT = 132;
  const progress = Math.min(1, Math.abs(offsetX) / ACTION_THRESHOLD);

  React.useEffect(() => {
    return () => {
      if (completionTimerRef.current) window.clearTimeout(completionTimerRef.current);
    };
  }, []);

  function setDragOffset(value: number) {
    offsetRef.current = value;
    setOffsetX(value);
  }

  function limitOffset(value: number) {
    const sign = Math.sign(value);
    const abs = Math.abs(value);
    if (abs <= ACTION_LIMIT) return value;
    return sign * (ACTION_LIMIT + (abs - ACTION_LIMIT) * 0.16);
  }

  function resetDrag() {
    pointerIdRef.current = null;
    intentRef.current = "idle";
    setIsDragging(false);
    setDragOffset(0);
  }

  function completeAction(action: "done" | "delete") {
    setIsDragging(false);
    setDragOffset(action === "done" ? ACTION_REVEAL : -ACTION_REVEAL);
    completionTimerRef.current = window.setTimeout(() => {
      resetDrag();
      completionTimerRef.current = null;
      if (action === "done") onDone?.(item);
      if (action === "delete") onDelete?.(item);
    }, 130);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) return;
    const target = event.target as HTMLElement;
    if (target.closest("button,a,input,textarea")) return;

    if (completionTimerRef.current) {
      window.clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }

    pointerIdRef.current = event.pointerId;
    intentRef.current = "idle";
    startPointRef.current = { x: event.clientX, y: event.clientY };
    originOffsetRef.current = offsetRef.current;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== event.pointerId) return;

    const dx = event.clientX - startPointRef.current.x;
    const dy = event.clientY - startPointRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (intentRef.current === "idle") {
      if (absX < 7 && absY < 7) return;
      intentRef.current = absX > absY * 1.18 ? "horizontal" : "vertical";
    }

    if (intentRef.current !== "horizontal") return;

    event.preventDefault();
    setDragOffset(limitOffset(originOffsetRef.current + dx));
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== event.pointerId) return;

    if (intentRef.current === "horizontal") {
      const finalOffset = offsetRef.current;
      if (finalOffset > ACTION_THRESHOLD && onDone) {
        completeAction("done");
        return;
      }
      if (finalOffset < -ACTION_THRESHOLD && onDelete) {
        completeAction("delete");
        return;
      }
    }

    resetDrag();
  }

  function handlePointerCancel(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current === event.pointerId) {
      resetDrag();
    }
  }

  function handlePointerLost(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current === event.pointerId && isDragging) {
      resetDrag();
    }
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (Math.abs(offsetRef.current) > 4) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  const showDoneAction = offsetX > 12 && onDone;
  const showDeleteAction = offsetX < -12 && onDelete;
  const actionBackground =
    offsetX > 0 ? "bg-emerald-500/10" : offsetX < 0 ? "bg-rose-500/10" : "bg-muted/20";

  return (
    <div className={cn("relative overflow-hidden rounded-[13px]", className)}>
      <div
        className={cn(
          "absolute inset-0 transition-colors duration-150",
          actionBackground
        )}
      />
      <div className="absolute inset-0" aria-hidden="true">
        <div
          className={cn(
            "absolute inset-y-0 left-4 flex items-center gap-1 text-emerald-700 transition-all duration-150",
            showDoneAction ? "opacity-100" : "opacity-0"
          )}
          style={{ transform: `scale(${0.92 + progress * 0.08})` }}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-emerald-500 text-white shadow-card">
            <Check className="h-4 w-4" />
          </span>
          <span className="text-[12px] font-bold">تم</span>
        </div>
        <div
          className={cn(
            "absolute inset-y-0 right-4 flex items-center gap-1 text-rose-700 transition-all duration-150",
            showDeleteAction ? "opacity-100" : "opacity-0"
          )}
          style={{ transform: `scale(${0.92 + progress * 0.08})` }}
        >
          <span className="text-[12px] font-bold">حذف</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-rose-500 text-white shadow-card">
            <Trash2 className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div
        className={cn(
          "relative min-h-[70px] touch-pan-y select-none overflow-hidden rounded-[13px] border border-border bg-surface transition-[box-shadow,transform] will-change-transform",
          Math.abs(offsetX) > 10 && "shadow-lg"
        )}
        style={{
          transform: `translate3d(${offsetX}px, 0, 0)`,
          transitionDuration: isDragging ? "0ms" : "210ms",
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handlePointerLost}
        onClickCapture={handleClick}
      >
        <span className={cn("absolute inset-y-3 start-0 w-1 rounded-e-full", STATUS_MARKER[status])} />
        <div className="flex items-start gap-3 px-3 py-2.5 ps-4">
          <button
            type="button"
            onClick={() => onDone?.(item)}
            aria-label="إنجاز المهمة"
            className={cn(
              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] border transition-colors",
              status === "done"
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-border bg-surface text-muted-foreground hover:border-emerald-300 hover:text-emerald-700"
            )}
            disabled={!onDone}
          >
            <Check className="h-3.5 w-3.5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 text-[15px] font-bold leading-snug">
                {item.title}
              </span>
              {onActionsClick && (
                <button
                  type="button"
                  onClick={() => onActionsClick(item)}
                  aria-label="إجراءات"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                {formatTimeRange(item.start_time, item.end_time)}
              </span>
              <StatusPill
                status={status}
                onClick={onStatusClick ? () => onStatusClick(item) : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
