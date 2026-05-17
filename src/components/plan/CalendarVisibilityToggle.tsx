"use client";

import { CalendarDays, CalendarOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarVisibilityToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function CalendarVisibilityToggle({
  checked,
  onCheckedChange,
  className,
}: CalendarVisibilityToggleProps) {
  const Icon = checked ? CalendarDays : CalendarOff;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-[12px] border border-border bg-background/70 px-3 py-2.5 text-start transition-colors hover:bg-muted/50",
        className
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]",
            checked ? "bg-sky-100 text-sky-700" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-bold">
            {checked ? "في التقويم" : "مهام فقط"}
          </span>
          <span className="block truncate text-[11px] font-semibold text-muted-foreground">
            {checked ? "تظهر في التقويم وتحفظ في Google" : "لن تظهر في التقويم"}
          </span>
        </span>
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-sky-500" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "-translate-x-5" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}
