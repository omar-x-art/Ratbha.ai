"use client";

import * as React from "react";
import { Check, Clock, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PlanSummaryCard } from "@/components/plan/PlanSummaryCard";
import { GroupHeader } from "@/components/plan/GroupHeader";
import { InboxCard } from "@/components/plan/InboxCard";
import { TaskItem } from "@/components/plan/TaskItem";
import { useTasksStore } from "@/lib/store/tasks-store";
import type { PillStatus, PlanItem } from "@/lib/types";

interface PlanReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: () => void;
}

function getItemStatus(
  item: PlanItem,
  itemStatuses: Record<string, PillStatus>
): PillStatus {
  if (itemStatuses[item.id]) return itemStatuses[item.id];
  if (item.is_locked) return "active";
  return "planned";
}

export function PlanReviewSheet({
  open,
  onOpenChange,
  onApprove,
}: PlanReviewSheetProps) {
  const buckets = useTasksStore((s) => s.buckets);
  const inbox = useTasksStore((s) => s.inbox);
  const itemStatuses = useTasksStore((s) => s.itemStatuses);
  const markDone = useTasksStore((s) => s.markDone);
  const postponeItem = useTasksStore((s) => s.postponeItem);
  const removeItem = useTasksStore((s) => s.removeItem);
  const resolveInboxTask = useTasksStore((s) => s.resolveInboxTask);

  const visibleBuckets = buckets.filter((bucket) => bucket.items.length > 0);
  const totalToday =
    buckets.find((bucket) => bucket.label === "today")?.items.length ?? 0;
  const totalLater = buckets
    .filter((bucket) => bucket.label !== "today")
    .reduce((sum, bucket) => sum + bucket.items.length, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>راجع الخطة قبل الاعتماد</SheetTitle>
          <SheetDescription>
            عدّل السريع من هنا، وبعد الاعتماد تظهر الخطة في يومك.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 pb-2">
          <PlanSummaryCard totalToday={totalToday} totalLater={totalLater} />

          {visibleBuckets.length === 0 ? (
            <p className="rounded-card bg-muted px-3 py-4 text-center text-[13px] text-muted-foreground">
              لا توجد مهام في الخطة الحالية.
            </p>
          ) : (
            visibleBuckets.map((bucket, index) => (
              <GroupHeader
                key={bucket.date}
                label={bucket.arabicLabel}
                count={bucket.items.length}
                color={
                  index === 0 ? "primary" : index === 1 ? "warning" : "secondary"
                }
              >
                {bucket.items.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2">
                    <TaskItem
                      item={item}
                      pillStatus={getItemStatus(item, itemStatuses)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="soft"
                        title="تم"
                        aria-label="تم"
                        onClick={() => markDone(item.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        title="أجّل"
                        aria-label="أجّل"
                        onClick={() => postponeItem(item.id)}
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="danger"
                        title="حذف"
                        aria-label="حذف"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </GroupHeader>
            ))
          )}

          {inbox.length > 0 && (
            <GroupHeader label="تحتاج توضيح" count={inbox.length} color="danger">
              {inbox.map((task) => (
                <InboxCard
                  key={task.id}
                  task={task}
                  question={task.reason}
                  options={[
                    { id: "today", label: "اليوم" },
                    { id: "tomorrow", label: "بكرة" },
                    { id: "later", label: "لاحقاً" },
                  ]}
                  onPick={() => resolveInboxTask(task.id)}
                />
              ))}
            </GroupHeader>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button type="button" size="lg" onClick={onApprove}>
              اعتمد الخطة
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              رجوع للمحادثة
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
