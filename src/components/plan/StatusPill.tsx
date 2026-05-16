"use client";

import { cn } from "@/lib/utils";
import type { PillStatus } from "@/lib/types";

interface StatusPillProps {
  status: PillStatus;
  onClick?: () => void;
  className?: string;
}

const STATUS_MAP: Record<PillStatus, { label: string; classes: string }> = {
  active: {
    label: "نشط",
    classes: "bg-amber-100 text-amber-900 border-amber-200",
  },
  done: {
    label: "منجز",
    classes: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
  overdue: {
    label: "متأخر",
    classes: "bg-rose-100 text-rose-900 border-rose-200",
  },
  planned: {
    label: "مخطط",
    classes: "bg-sky-100 text-sky-900 border-sky-200",
  },
  inbox: {
    label: "وارد",
    classes: "bg-violet-100 text-violet-900 border-violet-200",
  },
};

export function StatusPill({ status, onClick, className }: StatusPillProps) {
  const { label, classes } = STATUS_MAP[status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-6 min-w-[54px] items-center justify-center rounded-[7px] border px-2 text-[11px] font-bold transition-colors",
        classes,
        onClick && "cursor-pointer hover:brightness-95",
        !onClick && "cursor-default",
        className
      )}
    >
      {label}
    </button>
  );
}
