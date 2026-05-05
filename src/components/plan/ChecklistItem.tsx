"use client";

import * as React from "react";
import { Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChecklistTask } from "@/lib/store/tasks-store";

const ARABIC_TIME = new Intl.DateTimeFormat("ar-EG", {
  hour: "numeric",
  minute: "2-digit",
});

interface ChecklistItemProps {
  task: ChecklistTask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ChecklistItem({ task, onToggle, onDelete }: ChecklistItemProps) {
  const time = task.start_time
    ? ARABIC_TIME.format(new Date(task.start_time))
    : null;
  const endTime = task.end_time
    ? ARABIC_TIME.format(new Date(task.end_time))
    : null;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-card border border-border bg-surface px-3 py-3",
        task.done && "opacity-60"
      )}
    >
      <button
        type="button"
        aria-label={task.done ? "ألغِ الإكمال" : "علّم كمكتمل"}
        onClick={() => onToggle(task.id)}
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          task.done
            ? "border-primary-600 bg-primary-600 text-white"
            : "border-border bg-background text-transparent hover:border-primary-400"
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </button>

      <div className="flex flex-1 flex-col gap-0.5">
        <p
          className={cn(
            "text-[14px] font-medium leading-tight",
            task.done && "line-through"
          )}
        >
          {task.title}
        </p>
        {(time || task.reason) && (
          <p className="text-[12px] text-muted-foreground">
            {time && (
              <span>
                {time}
                {endTime ? ` — ${endTime}` : ""}
              </span>
            )}
            {time && task.reason ? " • " : ""}
            {task.reason}
          </p>
        )}
      </div>

      <button
        type="button"
        aria-label="احذف"
        onClick={() => onDelete(task.id)}
        className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-red-50 hover:text-danger"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
