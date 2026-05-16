"use client";

import * as React from "react";
import { ArrowRight, CalendarClock, Pin, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlanItem } from "@/lib/types";

interface BottomSheetEditTaskProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PlanItem | null;
  onSave?: (next: PlanItem) => void;
  onDelete?: (id: string) => void;
  onPostpone?: (id: string) => void;
  onPin?: (id: string) => void;
}

function toLocalDateInput(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toLocalTimeInput(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function combineDateTime(date: string, time: string) {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return new Date(y, mo - 1, d, h, mi).toISOString();
}

export function BottomSheetEditTask({
  open,
  onOpenChange,
  item,
  onSave,
  onDelete,
  onPostpone,
  onPin,
}: BottomSheetEditTaskProps) {
  const [date, setDate] = React.useState("");
  const [start, setStart] = React.useState("");
  const [duration, setDuration] = React.useState(60);

  React.useEffect(() => {
    if (!item) return;
    setDate(toLocalDateInput(item.start_time));
    setStart(toLocalTimeInput(item.start_time));
    const minutes = Math.round(
      (new Date(item.end_time).getTime() - new Date(item.start_time).getTime()) /
        60000
    );
    setDuration(minutes);
  }, [item]);

  if (!item) return null;

  function handleSave() {
    if (!item) return;
    const startISO = combineDateTime(date, start);
    const endISO = new Date(
      new Date(startISO).getTime() + Math.max(duration, 5) * 60_000
    ).toISOString();
    onSave?.({ ...item, start_time: startISO, end_time: endISO });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>تعديل المهمة</SheetTitle>
          <SheetDescription className="line-clamp-2">{item.title}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[13px] text-muted-foreground">اليوم</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] text-muted-foreground">يبدأ</label>
              <Input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] text-muted-foreground">
                المدة بالدقائق
              </label>
              <Input
                type="number"
                inputMode="numeric"
                min={5}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) || 30)}
              />
            </div>
          </div>

          <div className="my-2 grid grid-cols-3 gap-2">
            {onPin && (
              <Button
                variant="soft"
                size="sm"
                onClick={() => onPin(item.id)}
                className="justify-center gap-1"
              >
                <Pin className="h-4 w-4" />
                تثبيت
              </Button>
            )}
            {onPostpone && (
              <Button
                variant="soft"
                size="sm"
                onClick={() => onPostpone(item.id)}
                className="justify-center gap-1"
              >
                <CalendarClock className="h-4 w-4" />
                للغد
              </Button>
            )}
            {onDelete && (
              <Button
                variant="soft"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="justify-center gap-1 text-danger hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            )}
          </div>

          <Button onClick={handleSave} size="lg" className="w-full">
            حفظ الوقت
            <ArrowRight className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
