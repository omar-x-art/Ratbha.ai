"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { BottomNav } from "@/components/shell/BottomNav";
import { QuickFindBar } from "@/components/shell/QuickFindBar";
import { PullToRefresh } from "@/components/shell/PullToRefresh";
import { GroupHeader } from "@/components/plan/GroupHeader";
import { SwipeableTaskItem } from "@/components/plan/SwipeableTaskItem";
import { NextTaskWidget } from "@/components/plan/NextTaskWidget";
import { DayProgressBar } from "@/components/plan/DayProgressBar";
import { TaskActionsSheet } from "@/components/plan/TaskActionsSheet";
import { StatusPickerSheet } from "@/components/plan/StatusPickerSheet";
import { SkeletonGroup } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useTasksStore } from "@/lib/store/tasks-store";
import type { PlanItem } from "@/lib/types";
import type { PillStatus } from "@/components/plan/StatusPill";

export default function TodayPage() {
  const router = useRouter();
  const { toast } = useToast();

  const buckets = useTasksStore((s) => s.buckets);
  const itemStatuses = useTasksStore((s) => s.itemStatuses);
  const removeItem = useTasksStore((s) => s.removeItem);
  const postponeItem = useTasksStore((s) => s.postponeItem);
  const markDone = useTasksStore((s) => s.markDone);
  const setItemStatus = useTasksStore((s) => s.setItemStatus);

  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [actionsSheet, setActionsSheet] = React.useState<{
    open: boolean;
    item: PlanItem | null;
  }>({ open: false, item: null });
  const [statusSheet, setStatusSheet] = React.useState<{
    open: boolean;
    item: PlanItem | null;
  }>({ open: false, item: null });

  const allItems = buckets.flatMap((b) => b.items);
  const doneCount = allItems.filter(
    (i) => itemStatuses[i.id] === "done"
  ).length;
  const nextItem = allItems.find((i) => itemStatuses[i.id] !== "done") ?? null;

  const todayBucket = buckets.find((b) => b.label === "today");
  const tomorrowBucket = buckets.find((b) => b.label === "tomorrow");
  const laterBuckets = buckets.filter(
    (b) => b.label !== "today" && b.label !== "tomorrow"
  );

  function getItemStatus(item: PlanItem): PillStatus {
    if (itemStatuses[item.id]) return itemStatuses[item.id];
    if (item.is_locked) return "active";
    return "planned";
  }

  function handleDone(item: PlanItem) {
    markDone(item.id);
    toast({ title: `تم إنجاز: ${item.title}`, variant: "success" });
  }

  function handleDelete(item: PlanItem) {
    removeItem(item.id);
    toast({ title: `تم حذف: ${item.title}`, variant: "danger" });
  }

  function handlePostpone() {
    if (!actionsSheet.item) return;
    postponeItem(actionsSheet.item.id);
    toast({ title: "تم تأجيل المهمة للغد" });
    setActionsSheet({ open: false, item: null });
  }

  function handleDeleteFromSheet() {
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
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    toast({ title: "تم التحديث", variant: "success" });
  }

  function renderBucket(
    bucket: { date: string; label: string; arabicLabel: string; items: PlanItem[] },
    color: "primary" | "warning" | "secondary",
    showAdd?: boolean
  ) {
    const filtered = bucket.items.filter(
      (i) => !search || i.title.includes(search)
    );
    if (filtered.length === 0 && !search) return null;
    return (
      <GroupHeader
        label={bucket.arabicLabel}
        count={filtered.length}
        color={color}
        onAdd={showAdd ? () => router.push("/chat") : undefined}
      >
        {filtered.map((planItem) => (
          <SwipeableTaskItem
            key={planItem.id}
            item={planItem}
            pillStatus={getItemStatus(planItem)}
            onDone={handleDone}
            onDelete={handleDelete}
            onActionsClick={(i) => setActionsSheet({ open: true, item: i })}
            onStatusClick={(i) => setStatusSheet({ open: true, item: i })}
          />
        ))}
      </GroupHeader>
    );
  }

  return (
    <AppShellMobile withBottomNav>
      <TopBar title="يومي" showSettings />

      <PullToRefresh onRefresh={refresh}>
        <div className="flex flex-col gap-4 px-4 pb-8 pt-4">
          <DayProgressBar total={allItems.length} done={doneCount} />

          <NextTaskWidget
            item={nextItem}
            onDone={() => {
              if (nextItem) handleDone(nextItem);
            }}
            onPostpone={() => {
              if (nextItem) {
                postponeItem(nextItem.id);
                toast({ title: "أجّلنا المهمة" });
              }
            }}
            onReorganize={() => router.push("/plan/preview")}
          />

          <QuickFindBar
            value={search}
            onChange={setSearch}
            onAdd={() => router.push("/chat")}
          />

          {loading ? (
            <>
              <SkeletonGroup count={2} />
              <SkeletonGroup count={1} />
            </>
          ) : (
            <>
              {todayBucket && renderBucket(todayBucket, "primary", true)}
              {tomorrowBucket && renderBucket(tomorrowBucket, "warning")}
              {laterBuckets.map((b) => renderBucket(b, "secondary"))}
            </>
          )}
        </div>
      </PullToRefresh>

      <BottomNav />

      <TaskActionsSheet
        open={actionsSheet.open}
        onOpenChange={(o) => setActionsSheet((p) => ({ ...p, open: o }))}
        item={actionsSheet.item}
        onPostpone={handlePostpone}
        onDelete={handleDeleteFromSheet}
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
