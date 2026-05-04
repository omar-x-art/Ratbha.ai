"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, RotateCw, Save } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/button";
import { ReassureBar } from "@/components/chat/ReassureBar";
import { PlanSummaryCard } from "@/components/plan/PlanSummaryCard";
import { DaySection } from "@/components/plan/DaySection";
import { TaskItem } from "@/components/plan/TaskItem";
import { InboxCard } from "@/components/plan/InboxCard";
import { useToast } from "@/components/ui/use-toast";
import { MOCK_PLAN } from "@/lib/mock/plans";
import { usePlanStore } from "@/lib/store/plan-store";

export default function PlanPreviewPage() {
  const { toast } = useToast();
  const router = useRouter();
  const storedPlan = usePlanStore((s) => s.plan);
  const plan = storedPlan ?? MOCK_PLAN;

  const totalToday =
    plan.buckets.find((b) => b.label === "today")?.items.length ?? 0;
  const totalLater = plan.buckets
    .filter((b) => b.label !== "today")
    .reduce((s, b) => s + b.items.length, 0);

  async function saveToCalendar() {
    const items = plan.buckets.flatMap((b) => b.items);
    try {
      await fetch("/api/calendar/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
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

  return (
    <AppShellMobile>
      <TopBar title="خطتك" showBack />
      <div className="flex flex-col gap-4 px-4 pb-8 pt-4">
        <PlanSummaryCard
          totalToday={totalToday}
          totalLater={totalLater}
          reasonText={
            plan.input_text
              ? `بناءً على: «${plan.input_text}»`
              : "اقترحت لك هذه الخطة بناءً على ما كتبته."
          }
        />

        {plan.buckets.length === 0 && plan.inbox.length === 0 && (
          <p className="rounded-card border border-border bg-surface p-4 text-[13px] text-muted-foreground">
            لا توجد مهام مقترحة. ارجع للشاشة الرئيسية واكتب مهامك.
          </p>
        )}

        {plan.buckets.map((bucket) => (
          <DaySection key={bucket.date} label={bucket.arabicLabel}>
            {bucket.items.map((item) => (
              <TaskItem key={item.id} item={item} />
            ))}
          </DaySection>
        ))}

        {plan.inbox.length > 0 && (
          <DaySection label="تحتاج توضيح">
            {plan.inbox.map((task) => (
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
          </DaySection>
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
            <Button variant="outline" size="md" asChild>
              <Link href="/">
                <RotateCw className="h-4 w-4" />
                أعد التخطيط
              </Link>
            </Button>
          </div>
        </div>

        <ReassureBar className="mt-2 text-center">
          لن نحفظ أي شيء في تقويمك قبل مراجعتك.
        </ReassureBar>
      </div>
    </AppShellMobile>
  );
}
