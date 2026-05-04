"use client";

import * as React from "react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { InboxCard } from "@/components/plan/InboxCard";
import { useToast } from "@/components/ui/use-toast";
import { MOCK_INBOX_TASKS } from "@/lib/mock/tasks";
import { usePlanStore } from "@/lib/store/plan-store";

export default function InboxPage() {
  const { toast } = useToast();
  const storedPlan = usePlanStore((s) => s.plan);
  const setPlan = usePlanStore((s) => s.setPlan);

  const inbox = storedPlan?.inbox ?? MOCK_INBOX_TASKS;

  function resolve(id: string, label: string) {
    if (storedPlan) {
      setPlan({
        ...storedPlan,
        inbox: storedPlan.inbox.filter((t) => t.id !== id),
      });
    }
    toast({
      title: "تم تحديد الموعد",
      description: `جدولة المهمة لـ «${label}».`,
      variant: "success",
    });
  }

  return (
    <AppShellMobile>
      <TopBar title="مهام تحتاج توضيح" showBack />
      <div className="flex flex-col gap-3 px-4 py-4">
        {inbox.length === 0 && (
          <p className="mt-12 text-center text-[14px] text-muted-foreground">
            لا توجد مهام في الـInbox الآن.
          </p>
        )}
        {inbox.map((task) => (
          <InboxCard
            key={task.id}
            task={task}
            question={task.reason}
            options={[
              { id: `${task.id}-today`, label: "اليوم" },
              { id: `${task.id}-tomorrow`, label: "بكرة" },
              { id: `${task.id}-week`, label: "هذا الأسبوع" },
            ]}
            onPick={(c) => resolve(task.id, c.label)}
          />
        ))}
      </div>
    </AppShellMobile>
  );
}
