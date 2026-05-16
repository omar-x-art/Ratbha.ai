"use client";

import { cn } from "@/lib/utils";

export type MetricTone = "sky" | "emerald" | "amber" | "violet" | "rose";

export interface MetricItem {
  label: string;
  value: string;
  tone: MetricTone;
}

interface MetricsStripProps {
  items: MetricItem[];
  columns?: 2 | 3;
  className?: string;
}

const TONE_MAP: Record<MetricTone, string> = {
  sky: "bg-sky-50 text-sky-900 border-sky-100",
  emerald: "bg-emerald-50 text-emerald-900 border-emerald-100",
  amber: "bg-amber-50 text-amber-900 border-amber-100",
  violet: "bg-violet-50 text-violet-900 border-violet-100",
  rose: "bg-rose-50 text-rose-900 border-rose-100",
};

export function MetricsStrip({ items, columns = 3, className }: MetricsStripProps) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 2 ? "grid-cols-2" : "grid-cols-3",
        className
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "min-w-0 rounded-[12px] border px-2 py-2",
            TONE_MAP[item.tone]
          )}
        >
          <p className="truncate text-[11px] font-semibold opacity-75">
            {item.label}
          </p>
          <p className="mt-0.5 truncate text-[14px] font-black">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
