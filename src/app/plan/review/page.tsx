"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { Button } from "@/components/ui/button";
import { ReassureBar } from "@/components/chat/ReassureBar";
import { GroupHeader } from "@/components/plan/GroupHeader";
import { TaskItem } from "@/components/plan/TaskItem";
import { TaskActionsSheet } from "@/components/plan/TaskActionsSheet";
import { StatusPickerSheet } from "@/components/plan/StatusPickerSheet";
import { BottomSheetEditTask } from "@/components/plan/BottomSheetEditTask";
import { useToast } from "@/components/ui/use-toast";
import { useTasksStore } from "@/lib/store/tasks-store";
import type { PlanItem } from "@/lib/types";
import type { PillStatus } from "@/components/plan/StatusPill";

export default function PlanReviewPage() {
  const router = useRouter();
  const { toast } = useToast();

  const buckets = useTasksStore((s) => s.buckets);
  const itemStatuses = useTasksStore((s) => s.itemStatuses);
  const updateItem = useTasksStore((s) => s.updateItem);
  const removeItem = useTasksStore((s) => s.removeItem);
  const postponeItem = useTasksStore((s) => s.postponeItem);
  const pinItem = useTasksStore((s) => s.pinItem);
  const setItemStatus = useTasksStore((s) => s.setItemStatus);

  const [editing, setEditing] = React.useState<PlanItem | null>(null);
  const [open, setOpen] = React.useState(false);
  const [actionsSheet, setActionsSheet] = React.useState<{
    open: boolean;
    item: PlanItem | null;
  }>({ open: false, item: null });
  const [statusSheet, setStatusSheet] = React.useState<{
    open: boolean;
    item: PlanItem | null;
  }>({ open: false, item: null });

  function getItemStatus(item: PlanItem): PillStatus {
    if (itemStatuses[item.id]) return itemStatuses[item.id];
    if (item.is_locked) return "active";
    return "planned";
  }

  function openEdit(item: PlanItem) {
    setEditing(item);
    setOpen(true);
  }

  function onSaveItem(next: PlanItem) {
    updateItem(next.id, next);
    setOpen(false);
  }

  function onDelete(id: string) {
    removeItem(id);
    setOpen(false);
  }

  function onPostpone(id: string) {
    postponeItem(id);
    setOpen(false);
  }

  function onPin(id: string) {
    pinItem(id);
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

  function handleStatusPick(status: PillStatus) {
    if (!statusSheet.item) return;
    setItemStatus(statusSheet.item.id, status);
    toast({ title: "تم تغيير الحالة" });
    setStatusSheet({ open: false, item: null });
  }

  return (
    <AppShellMobile withBottomNav>
      <TopBar title="راجع وعدّل" showBack />
      <div className="flex flex-col gap-4 px-4 pb-32 pt-3">
        <Breadcrumb
          items={[
            { label: "الرئيسية", href: "/" },
            { label: "خطة اليوم", href: "/plan/preview" },
            { label: "تعديل المهام" },
          ]}
        />

        {buckets.map((bucket, idx) => (
          <GroupHeader
            key={bucket.date}
            label={bucket.arabicLabel}
            count={bucket.items.length}
            color={
              idx === 0 ? "primary" : idx === 1 ? "warning" : "secondary"
            }
          >
            {bucket.items.map((item) => (
              <TaskItem
                key={item.id}
                item={item}
                pillStatus={getItemStatus(item)}
                onEdit={openEdit}
                onActionsClick={(i) => setActionsSheet({ open: true, item: i })}
                onStatusClick={(i) => setStatusSheet({ open: true, item: i })}
              />
            ))}
            {bucket.items.length === 0 && (
              <p className="text-[12px] text-muted-foreground">
                لا توجد مهام في هذا اليوم.
              </p>
            )}
          </GroupHeader>
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

      <TaskActionsSheet
        open={actionsSheet.open}
        onOpenChange={(o) => setActionsSheet((p) => ({ ...p, open: o }))}
        item={actionsSheet.item}
        onEdit={openEdit}
        onPostpone={() => {
          if (actionsSheet.item) onPostpone(actionsSheet.item.id);
          setActionsSheet({ open: false, item: null });
        }}
        onDelete={() => {
          if (actionsSheet.item) onDelete(actionsSheet.item.id);
          setActionsSheet({ open: false, item: null });
        }}
        onPin={() => {
          if (actionsSheet.item) onPin(actionsSheet.item.id);
          setActionsSheet({ open: false, item: null });
        }}
      />

      <StatusPickerSheet
        open={statusSheet.open}
        onOpenChange={(o) => setStatusSheet((p) => ({ ...p, open: o }))}
        current={statusSheet.item ? getItemStatus(statusSheet.item) : "planned"}
        onPick={handleStatusPick}
      />
    </AppShellMobile>
  );
}
