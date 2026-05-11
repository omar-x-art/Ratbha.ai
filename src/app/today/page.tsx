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
import { MOCK_PLAN, nextUpcomingItem } from "@/lib/mock/plans";
import type { PlanItem } from "@/lib/types";

export default function TodayPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [item, setItem] = React.useState(() => nextUpcomingItem(MOCK_PLAN));
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

  function done() {
    toast({ title: "أحسنت! تم إنجاز المهمة.", variant: "success" });
    setItem(null);
  }

  function postpone() {
    toast({
      title: "أجّلنا المهمة",
      description: "سنقترح لها وقتاً آخر لاحقاً.",
    });
  }

  function openActions(planItem: PlanItem) {
    setActionsSheet({ open: true, item: planItem });
  }

  function openStatusPicker(planItem: PlanItem) {
    setStatusSheet({ open: true, item: planItem });
  }

  function handleItemDone(planItem: PlanItem) {
    toast({ title: `تم إنجاز: ${planItem.title}`, variant: "success" });
  }

  function handleItemDelete(planItem: PlanItem) {
    toast({ title: `تم حذف: ${planItem.title}`, variant: "danger" });
  }

  async function refresh() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    toast({ title: "تم التحديث", variant: "success" });
  }

  const buckets = MOCK_PLAN.buckets;
  const todayBucket = buckets.find((b) => b.label === "today");
  const tomorrowBucket = buckets.find((b) => b.label === "tomorrow");
  const laterBuckets = buckets.filter(
    (b) => b.label !== "today" && b.label !== "tomorrow"
  );

  const allItems = buckets.flatMap((b) => b.items);
  const doneCount = allItems.filter(
    (i) => i.item_type === "existing_event" || i.is_locked
  ).length;

  return (
    <AppShellMobile withBottomNav>
      <TopBar title="يومي" showSettings />

      <PullToRefresh onRefresh={refresh}>
        <div className="flex flex-col gap-4 px-4 pb-8 pt-4">
          <DayProgressBar total={allItems.length} done={doneCount} />

          <NextTaskWidget
            item={item}
            onDone={done}
            onPostpone={postpone}
            onReorganize={() => router.push("/plan/preview")}
          />

          <QuickFindBar
            value={search}
            onChange={setSearch}
            onAdd={() => router.push("/")}
          />

          {loading ? (
            <>
              <SkeletonGroup count={2} />
              <SkeletonGroup count={1} />
            </>
          ) : (
            <>
              {todayBucket && todayBucket.items.length > 0 && (
                <GroupHeader
                  label="اليوم"
                  count={todayBucket.items.length}
                  color="primary"
                  onAdd={() => router.push("/")}
                >
                  {todayBucket.items
                    .filter(
                      (i) =>
                        !search || i.title.includes(search)
                    )
                    .map((planItem) => (
                      <SwipeableTaskItem
                        key={planItem.id}
                        item={planItem}
                        onDone={handleItemDone}
                        onDelete={handleItemDelete}
                        onActionsClick={openActions}
                        onStatusClick={openStatusPicker}
                      />
                    ))}
                </GroupHeader>
              )}

              {tomorrowBucket && tomorrowBucket.items.length > 0 && (
                <GroupHeader
                  label="غداً"
                  count={tomorrowBucket.items.length}
                  color="warning"
                >
                  {tomorrowBucket.items
                    .filter(
                      (i) =>
                        !search || i.title.includes(search)
                    )
                    .map((planItem) => (
                      <SwipeableTaskItem
                        key={planItem.id}
                        item={planItem}
                        onDone={handleItemDone}
                        onDelete={handleItemDelete}
                        onActionsClick={openActions}
                        onStatusClick={openStatusPicker}
                      />
                    ))}
                </GroupHeader>
              )}

              {laterBuckets.map((bucket) => (
                <GroupHeader
                  key={bucket.date}
                  label={bucket.arabicLabel}
                  count={bucket.items.length}
                  color="secondary"
                >
                  {bucket.items
                    .filter(
                      (i) =>
                        !search || i.title.includes(search)
                    )
                    .map((planItem) => (
                      <SwipeableTaskItem
                        key={planItem.id}
                        item={planItem}
                        onDone={handleItemDone}
                        onDelete={handleItemDelete}
                        onActionsClick={openActions}
                        onStatusClick={openStatusPicker}
                      />
                    ))}
                </GroupHeader>
              ))}
            </>
          )}
        </div>
      </PullToRefresh>

      <BottomNav />

      <TaskActionsSheet
        open={actionsSheet.open}
        onOpenChange={(o) => setActionsSheet((p) => ({ ...p, open: o }))}
        item={actionsSheet.item}
        onPostpone={() => {
          toast({ title: "تم تأجيل المهمة" });
          setActionsSheet({ open: false, item: null });
        }}
        onDelete={() => {
          toast({ title: "تم حذف المهمة", variant: "danger" });
          setActionsSheet({ open: false, item: null });
        }}
      />

      <StatusPickerSheet
        open={statusSheet.open}
        onOpenChange={(o) => setStatusSheet((p) => ({ ...p, open: o }))}
        current="planned"
        onPick={() => {
          toast({ title: "تم تغيير الحالة" });
          setStatusSheet({ open: false, item: null });
        }}
      />
    </AppShellMobile>
  );
}
