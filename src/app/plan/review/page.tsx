"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ListChecks, Save } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/button";
import { ReassureBar } from "@/components/chat/ReassureBar";
import { DaySection } from "@/components/plan/DaySection";
import { TaskItem } from "@/components/plan/TaskItem";
import { BottomSheetEditTask } from "@/components/plan/BottomSheetEditTask";
import { useToast } from "@/components/ui/use-toast";
import { MOCK_PLAN } from "@/lib/mock/plans";
import { usePlanStore } from "@/lib/store/plan-store";
import { useTasksStore } from "@/lib/store/tasks-store";
import type { PlanItem } from "@/lib/types";

export default function PlanReviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const storedPlan = usePlanStore((s) => s.plan);
  const setPlan = usePlanStore((s) => s.setPlan);
  const updateItem = usePlanStore((s) => s.updateItem);
  const removeItem = usePlanStore((s) => s.removeItem);
  const postponeItem = usePlanStore((s) => s.postponeItem);
  const pinItem = usePlanStore((s) => s.pinItem);
  const inputText = usePlanStore((s) => s.inputText);
  const addToChecklist = useTasksStore((s) => s.addFromPlanItems);

  // Hydrate the store with mock data the first time the user lands here directly.
  React.useEffect(() => {
    if (!storedPlan) setPlan(MOCK_PLAN);
  }, [storedPlan, setPlan]);

  const plan = storedPlan ?? MOCK_PLAN;
  const [editing, setEditing] = React.useState<PlanItem | null>(null);
  const [open, setOpen] = React.useState(false);

  function openEdit(item: PlanItem) {
    setEditing(item);
    setOpen(true);
  }

  function onSaveItem(next: PlanItem) {
    updateItem(next.id, next);
  }

  async function saveToCalendar() {
    const items = plan.buckets.flatMap((b) => b.items);
    try {
      await fetch("/api/calendar/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, plan, inputText }),
      });
      toast({
        title: "تم حفظ خطتك بنجاح",
        description: "أضفنا الأحداث إلى Google Calendar (تجريبي).",
        variant: "success",
      });
      setTimeout(() => router.push("/today"), 700);
    } catch {
      toast({
        title: "تعذّر الحفظ الآن",
        description: "أعد المحاولة بعد قليل.",
        variant: "danger",
      });
    }
  }

  function saveToChecklist() {
    const items = plan.buckets.flatMap((b) => b.items);
    if (items.length === 0) {
      toast({
        title: "لا توجد مهام لحفظها",
        description: "أضف مهمة قبل الحفظ.",
      });
      return;
    }
    const added = addToChecklist(items);
    toast({
      title:
        added > 0
          ? `حفظنا ${added} مهمة في قائمتك`
          : "كل المهام محفوظة سابقاً",
      description:
        added > 0
          ? "افتح «قائمة مهامي» لتعليمها بعد الإكمال."
          : "افتح القائمة لتعليم المنجز.",
      variant: "success",
    });
    setTimeout(() => router.push("/tasks"), 700);
  }

  return (
    <AppShellMobile>
      <TopBar title="راجع وعدّل" showBack />
      <div className="flex flex-col gap-4 px-4 pb-32 pt-4">
        {plan.buckets.map((bucket) => (
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
          لن نحفظ أي شيء قبل ضغطك على واحد من الزرّين.
        </ReassureBar>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-[480px] flex-col gap-2 border-t border-border bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
        <Button onClick={saveToCalendar} size="lg" className="w-full">
          <Save className="h-4 w-4" />
          احفظ في Google Calendar
        </Button>
        <Button
          onClick={saveToChecklist}
          size="lg"
          variant="soft"
          className="w-full"
        >
          <ListChecks className="h-4 w-4" />
          احفظ كقائمة مهام في التطبيق
        </Button>
      </div>

      <BottomSheetEditTask
        open={open}
        onOpenChange={setOpen}
        item={editing}
        onSave={onSaveItem}
        onDelete={(id) => {
          removeItem(id);
          setOpen(false);
        }}
        onPostpone={(id) => {
          postponeItem(id);
          setOpen(false);
        }}
        onPin={(id) => {
          pinItem(id);
          setOpen(false);
        }}
      />
    </AppShellMobile>
  );
}
