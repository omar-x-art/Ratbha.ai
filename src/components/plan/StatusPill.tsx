"use client";

import { cn } from "@/lib/utils";

export type PillStatus = "active" | "done" | "overdue" | "planned" | "inbox";

interface StatusPillProps {
  status: PillStatus;
  onClick?: () => void;
  className?: string;
}

const STATUS_MAP: Record<PillStatus, { label: string; classes: string }> = {
  active: {
    label: "نشط",
    classes: "bg-amber-100 text-amber-800 border-amber-200",
  },
  done: {
    label: "منجز",
    classes: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  overdue: {
    label: "متأخر",
    classes: "bg-red-100 text-red-800 border-red-200",
  },
  planned: {
    label: "مُخطط",
    classes: "bg-primary-100 text-primary-700 border-primary-200",
  },
  inbox: {
    label: "وارد",
    classes: "bg-secondary-100 text-secondary-700 border-secondary-200",
  },
};

export function StatusPill({ status, onClick, className }: StatusPillProps) {
  const { label, classes } = STATUS_MAP[status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-chip border px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
        classes,
        onClick && "cursor-pointer hover:opacity-80",
        !onClick && "cursor-default",
        className
      )}
    >
      {label}
    </button>
  );
}
