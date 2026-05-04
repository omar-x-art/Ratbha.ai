"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/button";
import { ReassureBar } from "@/components/chat/ReassureBar";
import { DaySection } from "@/components/plan/DaySection";
import { TaskItem } from "@/components/plan/TaskItem";
import { BottomSheetEditTask } from "@/components/plan/BottomSheetEditTask";
import { useToast } from "@/components/ui/use-toast";
import { MOCK_PLAN } from "@/lib/mock/plans";
import type { DayBucket, PlanItem } from "@/lib/types";

export default function PlanReviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [buckets, setBuckets] = React.useState<DayBucket[]>(MOCK_PLAN.buckets);
  const [editing, setEditing] = React.useState<PlanItem | null>(null);
  const [open, setOpen] = React.useState(false);

  function openEdit(item: PlanItem) {
    setEditing(item);
    setOpen(true);
  }

  function applyToBuckets(updater: (items: PlanItem[]) => PlanItem[]) {
    setBuckets((prev) =>
      prev.map((b) => ({
        ...b,
        items: updater(b.items),
      }))
    );
  }

  function onSaveItem(next: PlanItem) {
    applyToBuckets((items) =>
      items.map((it) => (it.id === next.id ? next : it))
    );
  }

  function onDelete(id: string) {
    applyToBuckets((items) => items.filter((it) => it.id !== id));
    setOpen(false);
  }

  function onPostpone(id: string) {
    applyToBuckets((items) =>
      items.map((it) =>
        it.id === id
          ? {
              ...it,
              start_time: new Date(
                new Date(it.start_time).getTime() + 24 * 60 * 60 * 1000
              ).toISOString(),
              end_time: new Date(
                new Date(it.end_time).getTime() + 24 * 60 * 60 * 1000
              ).toISOString(),
              reason: "أجّلتها للغد",
            }
          : it
      )
    );
    setOpen(false);
  }

  function onPin(id: string) {
    applyToBuckets((items) =>
      items.map((it) => (it.id === id ? { ...it, is_locked: true } : it))
    );
    setOpen(false);
  }

  function saveToCalendar() {
    toast({
      title: "تم حفظ خطتك بنجاح",
      description: "أضفنا الأحداث إلى Google Calendar (تجريبي).",
      variant: "success",
    });
    setTimeout(() => router.push("/today"), 700);
  }

  return (
    <AppShellMobile>
      <TopBar title="راجع وعدّل" showBack />
      <div className="flex flex-col gap-4 px-4 pb-32 pt-4">
        {buckets.map((bucket) => (
          <DaySection key={bucket.date} label={bucket.arabicLabel}>
            {bucket.items.map((item) => (
              <TaskItem key={item.id} item={item} onEdit={openEdit} />
            ))}
            {bucket.items.length === 0 && (
              <p className="text-[12px] text-muted-foreground">
                لا توجد مهام في هذا اليوم.
              </p>
            )}
          </DaySection>
        ))}

        <ReassureBar className="mt-2 text-center">
          لن نحفظ أي شيء في تقويمك قبل ضغطك على «احفظ».
        </ReassureBar>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-[480px] flex-col gap-2 border-t border-border bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
        <Button onClick={saveToCalendar} size="lg" className="w-full">
          <Save className="h-4 w-4" />
          احفظ في التقويم
        </Button>
      </div>

      <BottomSheetEditTask
        open={open}
        onOpenChange={setOpen}
        item={editing}
        onSave={onSaveItem}
        onDelete={onDelete}
        onPostpone={onPostpone}
        onPin={onPin}
      />
    </AppShellMobile>
  );
}
