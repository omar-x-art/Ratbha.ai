"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface Chip {
  id: string;
  label: string;
  onPick?: (chip: Chip) => void;
}

interface SuggestionChipsProps {
  chips: Chip[];
  onPick?: (chip: Chip) => void;
  className?: string;
}

export function SuggestionChips({
  chips,
  onPick,
  className,
}: SuggestionChipsProps) {
  return (
    <div
      role="list"
      className={cn(
        "flex flex-wrap gap-2 px-4",
        className
      )}
    >
      {chips.map((chip) => (
        <button
          key={chip.id}
          role="listitem"
          type="button"
          onClick={() => {
            chip.onPick?.(chip);
            onPick?.(chip);
          }}
          className="rounded-chip border border-primary-200 bg-primary-50 px-4 py-2 text-[13px] font-medium text-primary-700 transition-colors hover:bg-primary-100 active:bg-primary-200"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
