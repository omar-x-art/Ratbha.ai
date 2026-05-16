"use client";

import * as React from "react";
import { Check, Clock, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatTimeRange } from "@/lib/utils";
import type { PlanItem } from "@/lib/types";

interface NextTaskWidgetProps {
  item?: PlanItem | null;
  onDone?: () => void;
  onPostpone?: () => void;
  onReorganize?: () => void;
}

export function NextTaskWidget({
  item,
  onDone,
  onPostpone,
  onReorganize,
}: NextTaskWidgetProps) {
  if (!item) {
    return (
      <Card className="p-3">
        <div className="flex items-center gap-2.5">
          <Clock className="h-4 w-4 shrink-0 text-primary-600" />
          <p className="text-[14px] font-semibold">لا توجد مهمة قادمة</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-primary-100 bg-primary-50/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold text-primary-700">المهمة التالية</span>
          <h2 className="mt-0.5 text-[18px] font-bold leading-tight">
            {item.title}
          </h2>
        </div>
        <span className="flex shrink-0 items-center gap-1 pt-0.5 text-[12px] font-semibold text-primary-800">
          <Clock className="h-3.5 w-3.5" />
          {formatTimeRange(item.start_time, item.end_time)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <Button onClick={onDone} className="justify-center gap-1" size="sm">
          <Check className="h-4 w-4" />
          تم
        </Button>
        <Button
          variant="outline"
          onClick={onPostpone}
          className="justify-center gap-1"
          size="sm"
        >
          <Clock className="h-4 w-4" />
          للغد
        </Button>
        <Button
          variant="ghost"
          onClick={onReorganize}
          className="justify-center gap-1"
          size="sm"
        >
          <Pencil className="h-4 w-4" />
          تعديل
        </Button>
      </div>
    </Card>
  );
}
