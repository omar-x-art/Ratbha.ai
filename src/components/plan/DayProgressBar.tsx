"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DayProgressBarProps {
  total: number;
  done: number;
  showCount?: boolean;
  className?: string;
}

export function DayProgressBar({
  total,
  done,
  showCount = true,
  className,
}: DayProgressBarProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {showCount && (
        <span className="text-[12px] font-semibold text-primary-700 tabular-nums">
          {done}/{total}
        </span>
      )}
    </div>
  );
}
