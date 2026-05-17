"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, RotateCw, Save } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { BottomNav } from "@/components/shell/BottomNav";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { PullToRefresh } from "@/components/shell/PullToRefresh";
import { Button } from "@/components/ui/button";
import { PlanSummaryCard } from "@/components/plan/PlanSummaryCard";
import { GroupHeader } from "@/components/plan/GroupHeader";
import { TaskItem } from "@/components/plan/TaskItem";
import { TaskActionsSheet } from "@/components/plan/TaskActionsSheet";
import { StatusPickerSheet } from "@/components/plan/StatusPickerSheet";
import { BottomSheetEditTask } from "@/components/plan/BottomSheetEditTask";
import { InboxCard } from "@/components/plan/InboxCard";
import { useToast } from "@/components/ui/use-toast";
import { useTasksStore } from "@/lib/store/tasks-store";
import type { PillStatus, PlanItem } from "@/lib/types";

interface CalendarSaveResponse {
  saved: { id: string }[];
  mode: "google" | "legacy" | "not_connected" | "error";
  account?: { email: string };
  error?: string;
}

export default function PlanPreviewPage() {
  const { toast } = useToast();
  const router = useRouter();

  const buckets = useTasksStore((s) => s.buckets);
  const inbox = useTasksStore((s) => s.inbox);
  const itemStatuses = useTasksStore((s) => s.itemStatuses);
  const updateItem = useTasksStore((s) => s.updateItem);
  const removeItem = useTasksStore((s) => s.removeItem);
  const setItemStatus = useTasksStore((s) => s.setItemStatus);

  const [saving, setSaving] = React.useState(false);
  const [editing, setEditing] = React.useState<PlanItem | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [actionsSheet, setActionsSheet] = React.useState<{
    open: boolean;
    item: PlanItem | null;
  }>({ open: false, item: null });
  const [statusSheet, setStatusSheet] = React.useState<{
    open: boolean;
    item: PlanItem | null;
  }>({ open: false, item: null });

  const totalToday = buckets.find((b) => b.label === "today")?.items.length ?? 0;
  const totalLater = buckets
    .filter((b) => b.label !== "today")
    .reduce((s, b) => s + b.items.length, 0);

  function getItemStatus(item: PlanItem): PillStatus {
    if (itemStatuses[item.id]) return itemStatuses[item.id];
    if (item.is_locked) return "active";
    return "planned";
  }

  function openEdit(item: PlanItem) {
    setEditing(item);
    setEditOpen(true);
  }

  function handleEditSave(next: PlanItem) {
    updateItem(next.id, next);
    toast({ title: "تم حفظ التعديل", variant: "success" });
    setEditOpen(false);
  }

  async function saveToCalendar() {
    const items = buckets
      .flatMap((bucket) => bucket.items)
      .filter((item) => item.item_type !== "existing_event");

    if (items.length === 0) {
      toast({ title: "لا توجد مهام جديدة للحفظ" });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/calendar/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const result = (await response.json()) as CalendarSaveResponse;

      if (result.mode === "not_connected") {
        toast({
          title: "اربط Google Calendar أولا",
          description: "بعد الربط سنحفظ الخطة في حسابك الحقيقي.",
          variant: "danger",
        });
        router.push("/connect-calendar");
        return;
      }

      if (result.mode === "error" || !response.ok) {
        toast({
          title: "تعذر حفظ الخطة في التقويم",
          description: result.error ?? "أعد الربط ثم جرب مرة أخرى.",
          variant: "danger",
        });
        return;
      }

      toast({
        title: "تم حفظ خطتك في Google Calendar",
        description: result.account?.email
          ? `أضفنا ${result.saved.length} حدث إلى ${result.account.email}.`
          : `أضفنا ${result.saved.length} حدث إلى التقويم.`,
        variant: "success",
      });
      setTimeout(() => router.push("/today"), 700);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!actionsSheet.item) return;
    removeItem(actionsSheet.item.id);
    toast({ title: "تم حذف المهمة", variant: "danger" });
    setActionsSheet({ open: false, item: null });
  }

  function handleStatusPick(status: PillStatus) {
    if (!statusSheet.item) return;
    setItemStatus(statusSheet.item.id, status);
    toast({ title: "تم تغيير الحالة" });
    setStatusSheet({ open: false, item: null });
  }

  async function refresh() {
    toast({ title: "تم التحديث" });
  }

  return (
    <AppShellMobile withBottomNav>
      <TopBar title="خطتك" showBack />
      <PullToRefresh onRefresh={refresh}>
        <div className="flex flex-col gap-4 px-4 pb-8 pt-3">
          <Breadcrumb
            items={[
              { label: "الرئيسية", href: "/" },
              { label: "خطة اليوم" },
              { label: "المراجعة" },
            ]}
          />

          <PlanSummaryCard totalToday={totalToday} totalLater={totalLater} />

          {buckets.map((bucket, idx) => (
            <GroupHeader
              key={bucket.date}
              label={bucket.arabicLabel}
              count={bucket.items.length}
              color={idx === 0 ? "primary" : idx === 1 ? "warning" : "secondary"}
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
            </GroupHeader>
          ))}

          {inbox.length > 0 && (
            <GroupHeader label="تحتاج توضيح" count={inbox.length} color="danger">
              {inbox.map((task) => (
                <InboxCard
                  key={task.id}
                  task={task}
                  question={task.reason}
                  options={[
                    { id: "p-today", label: "اليوم" },
                    { id: "p-tomorrow", label: "بكرة" },
                    { id: "p-week", label: "هذا الأسبوع" },
                  ]}
                />
              ))}
            </GroupHeader>
          )}

          <div className="mt-2 flex flex-col gap-2">
            <Button asChild size="lg">
              <Link href="/plan/review">
                راجع وعدّل
                <ArrowRight className="h-4 w-4 rotate-180" />
              </Link>
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={saveToCalendar}
                variant="soft"
                size="md"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                احفظ في التقويم
              </Button>
              <Button variant="outline" size="md">
                <RotateCw className="h-4 w-4" />
                أعد التخطيط
              </Button>
            </div>
          </div>
        </div>
      </PullToRefresh>

      <BottomNav />

      <BottomSheetEditTask
        open={editOpen}
        onOpenChange={setEditOpen}
        item={editing}
        onSave={handleEditSave}
        onDelete={(id) => {
          removeItem(id);
          setEditOpen(false);
        }}
      />

      <TaskActionsSheet
        open={actionsSheet.open}
        onOpenChange={(o) => setActionsSheet((p) => ({ ...p, open: o }))}
        item={actionsSheet.item}
        onEdit={openEdit}
        onDelete={handleDelete}
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
