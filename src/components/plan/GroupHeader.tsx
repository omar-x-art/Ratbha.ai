"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
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
  primary: "text-primary-700 bg-primary-50",
  secondary: "text-secondary-700 bg-secondary-50",
  warning: "text-amber-700 bg-amber-50",
  danger: "text-red-700 bg-red-50",
  muted: "text-muted-foreground bg-muted",
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

  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex items-center justify-between rounded-card px-3 py-2.5 transition-colors",
          COLOR_MAP[color]
        )}
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              !open && "-rotate-90"
            )}
          />
          <span className="text-[14px] font-bold">{label}</span>
          {count !== undefined && (
            <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-semibold">
              {count}
            </span>
          )}
        </div>
        {onAdd && open && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                onAdd();
              }
            }}
            className="rounded-chip bg-white/70 px-2.5 py-0.5 text-[12px] font-semibold hover:bg-white"
          >
            + مهمة
          </span>
        )}
      </button>
      {open && <div className="flex flex-col gap-2">{children}</div>}
    </section>
  );
}
