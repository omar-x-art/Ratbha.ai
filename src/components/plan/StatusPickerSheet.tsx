"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { PillStatus } from "@/lib/types";

interface StatusPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: PillStatus;
  onPick: (status: PillStatus) => void;
}

const STATUSES: { value: PillStatus; label: string; desc: string }[] = [
  { value: "active", label: "نشط", desc: "المهمة جارية الآن" },
  { value: "done", label: "منجز", desc: "تم إنجاز المهمة" },
  { value: "overdue", label: "متأخر", desc: "تجاوزت الوقت المحدد" },
  { value: "planned", label: "مُخطط", desc: "مجدولة لوقت لاحق" },
  { value: "inbox", label: "وارد", desc: "تحتاج ترتيب" },
];

export function StatusPickerSheet({
  open,
  onOpenChange,
  current,
  onPick,
}: StatusPickerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="text-start">تغيير الحالة</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 pb-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                onPick(s.value);
                onOpenChange(false);
              }}
              className={`flex w-full items-center justify-between rounded-card px-3 py-3 text-start transition-colors hover:bg-muted ${
                s.value === current ? "bg-primary-50" : ""
              }`}
            >
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold">{s.label}</span>
                <span className="text-[12px] text-muted-foreground">
                  {s.desc}
                </span>
              </div>
              {s.value === current && (
                <span className="h-2 w-2 rounded-full bg-primary-500" />
              )}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
