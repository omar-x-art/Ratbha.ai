"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, RotateCw, Save } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { BottomNav } from "@/components/shell/BottomNav";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { PullToRefresh } from "@/components/shell/PullToRefresh";
import { Button } from "@/components/ui/button";
import { ReassureBar } from "@/components/chat/ReassureBar";
import { PlanSummaryCard } from "@/components/plan/PlanSummaryCard";
import { GroupHeader } from "@/components/plan/GroupHeader";
import { TaskItem } from "@/components/plan/TaskItem";
import { TaskActionsSheet } from "@/components/plan/TaskActionsSheet";
import { StatusPickerSheet } from "@/components/plan/StatusPickerSheet";
import { InboxCard } from "@/components/plan/InboxCard";
import { useToast } from "@/components/ui/use-toast";
import { MOCK_PLAN } from "@/lib/mock/plans";
import type { PlanItem } from "@/lib/types";

export default function PlanPreviewPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [actionsSheet, setActionsSheet] = React.useState<{
    open: boolean;
    item: PlanItem | null;
  }>({ open: false, item: null });
  const [statusSheet, setStatusSheet] = React.useState<{
    open: boolean;
    item: PlanItem | null;
  }>({ open: false, item: null });

  const totalToday =
    MOCK_PLAN.buckets.find((b) => b.label === "today")?.items.length ?? 0;
  const totalLater = MOCK_PLAN.buckets
    .filter((b) => b.label !== "today")
    .reduce((s, b) => s + b.items.length, 0);

  function saveToCalendar() {
    toast({
      title: "تم حفظ خطتك بنجاح",
      description: "أضفنا الأحداث إلى Google Calendar (تجريبي).",
      variant: "success",
    });
    setTimeout(() => router.push("/today"), 700);
  }

  function openActions(item: PlanItem) {
    setActionsSheet({ open: true, item });
  }

  function openStatusPicker(item: PlanItem) {
    setStatusSheet({ open: true, item });
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
            { label: "التقرير" },
          ]}
        />

        <PlanSummaryCard totalToday={totalToday} totalLater={totalLater} />

        {MOCK_PLAN.buckets.map((bucket, idx) => (
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
                onActionsClick={openActions}
                onStatusClick={openStatusPicker}
              />
            ))}
          </GroupHeader>
        ))}

        {MOCK_PLAN.inbox.length > 0 && (
          <GroupHeader
            label="تحتاج توضيح"
            count={MOCK_PLAN.inbox.length}
            color="danger"
          >
            {MOCK_PLAN.inbox.map((task) => (
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
            <Button onClick={saveToCalendar} variant="soft" size="md">
              <Save className="h-4 w-4" />
              احفظ في التقويم
            </Button>
            <Button variant="outline" size="md">
              <RotateCw className="h-4 w-4" />
              أعد التخطيط
            </Button>
          </div>
        </div>

        <ReassureBar className="mt-2 text-center">
          لن نحفظ أي شيء في تقويمك قبل مراجعتك.
        </ReassureBar>
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
