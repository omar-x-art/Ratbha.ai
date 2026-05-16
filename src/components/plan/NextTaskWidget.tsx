"use client";

import * as React from "react";
import { Check, Clock, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CharacterAvatar } from "@/components/characters/CharacterAvatar";
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
      <Card>
        <div className="flex items-center gap-3">
          <CharacterAvatar who="siraj" state="happy" size={48} />
          <div className="flex flex-col">
            <p className="text-[15px] font-semibold">لا توجد مهمة قادمة</p>
            <p className="text-[13px] text-muted-foreground">
              أضف مهمة بوقت محدد لتظهر هنا وفي التقويم.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-primary-100 bg-primary-50/50">
      <div className="flex items-start gap-3">
        <CharacterAvatar who="siraj" state="encouraging" size={48} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[12px] font-bold text-primary-700">
            المهمة التالية
          </span>
          <h2 className="mt-1 text-[20px] font-bold leading-tight">
            {item.title}
          </h2>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-semibold text-primary-800">
            <Clock className="h-4 w-4" />
            {formatTimeRange(item.start_time, item.end_time)}
          </span>
          {item.reason && (
            <p className="mt-2 text-[13px] text-muted-foreground">
              {item.reason}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button onClick={onDone} className="justify-center gap-1" size="md">
          <Check className="h-4 w-4" />
          تم
        </Button>
        <Button
          variant="outline"
          onClick={onPostpone}
          className="justify-center gap-1"
          size="md"
        >
          <Clock className="h-4 w-4" />
          للغد
        </Button>
        <Button
          variant="ghost"
          onClick={onReorganize}
          className="justify-center gap-1"
          size="md"
        >
          <Pencil className="h-4 w-4" />
          تعديل
        </Button>
      </div>
    </Card>
  );
}
