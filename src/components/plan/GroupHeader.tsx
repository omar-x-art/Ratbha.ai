"use client";

import * as React from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupHeaderProps {
  label: string;
  count?: number;
  color?: "primary" | "secondary" | "warning" | "danger" | "muted";
  defaultOpen?: boolean;
  onAdd?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const COLOR_MAP = {
  primary: {
    marker: "bg-sky-500",
    chip: "bg-sky-50 text-sky-900 border-sky-100",
  },
  secondary: {
    marker: "bg-violet-500",
    chip: "bg-violet-50 text-violet-900 border-violet-100",
  },
  warning: {
    marker: "bg-amber-400",
    chip: "bg-amber-50 text-amber-900 border-amber-100",
  },
  danger: {
    marker: "bg-rose-500",
    chip: "bg-rose-50 text-rose-900 border-rose-100",
  },
  muted: {
    marker: "bg-slate-400",
    chip: "bg-muted text-muted-foreground border-border",
  },
};

export function GroupHeader({
  label,
  count,
  color = "primary",
  defaultOpen = true,
  onAdd,
  className,
  children,
}: GroupHeaderProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const colors = COLOR_MAP[color];

  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-[10px] py-1.5 text-start transition-colors hover:bg-muted/60"
        >
          <span className={cn("h-5 w-1.5 rounded-full", colors.marker)} />
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              !open && "-rotate-90"
            )}
          />
          <span className="truncate text-[15px] font-bold">{label}</span>
          {count !== undefined && (
            <span
              className={cn(
                "rounded-[7px] border px-2 py-0.5 text-[11px] font-bold",
                colors.chip
              )}
            >
              {count}
            </span>
          )}
        </button>

        {onAdd && open && (
          <button
            type="button"
            onClick={onAdd}
            aria-label="إضافة مهمة"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-border bg-surface text-foreground shadow-card transition-colors hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && <div className="flex flex-col gap-1.5">{children}</div>}
    </section>
  );
}
