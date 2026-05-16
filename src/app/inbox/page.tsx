"use client";

import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { InboxCard } from "@/components/plan/InboxCard";
import { useToast } from "@/components/ui/use-toast";
import { useTasksStore } from "@/lib/store/tasks-store";

export default function InboxPage() {
  const { toast } = useToast();
  const tasks = useTasksStore((s) => s.inbox);
  const resolveInboxTask = useTasksStore((s) => s.resolveInboxTask);

  function resolve(id: string, label: string) {
    resolveInboxTask(id);
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
        {tasks.length === 0 && (
          <p className="mt-12 text-center text-[14px] text-muted-foreground">
            لا توجد مهام تحتاج توضيح الآن.
          </p>
        )}
        {tasks.map((task) => (
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
