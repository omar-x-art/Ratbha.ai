"use client";

import * as React from "react";
import Link from "next/link";
import { ListChecks, Plus } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ChecklistItem } from "@/components/plan/ChecklistItem";
import { useTasksStore, type ChecklistTask } from "@/lib/store/tasks-store";

const ARABIC_LONG = new Intl.DateTimeFormat("ar-EG", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function arabicLabelFor(dateStr: string | undefined, today: Date): string {
  if (!dateStr) return "بدون تاريخ";
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  const x = new Date(`${dateStr}T00:00:00`);
  const diff = Math.round((x.getTime() - t.getTime()) / 86_400_000);
  if (diff <= 0) return "اليوم";
  if (diff === 1) return "غداً";
  if (diff === 2) return "بعد غداً";
  return ARABIC_LONG.format(x);
}

interface Section {
  key: string;
  label: string;
  tasks: ChecklistTask[];
}

function groupTasks(tasks: ChecklistTask[], today: Date): Section[] {
  const active = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  const map = new Map<string, ChecklistTask[]>();
  for (const t of active) {
    const k = t.date ?? "no_date";
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(t);
  }

  const sortedKeys = Array.from(map.keys()).sort((a, b) => {
    if (a === "no_date") return 1;
    if (b === "no_date") return -1;
    return a.localeCompare(b);
  });

  const sections: Section[] = sortedKeys.map((k) => {
    const list = (map.get(k) ?? []).slice().sort((a, b) => {
      const at = a.start_time ? new Date(a.start_time).getTime() : Infinity;
      const bt = b.start_time ? new Date(b.start_time).getTime() : Infinity;
      return at - bt;
    });
    return {
      key: k,
      label: arabicLabelFor(k === "no_date" ? undefined : k, today),
      tasks: list,
    };
  });

  if (done.length > 0) {
    sections.push({
      key: "_done",
      label: "مكتمل",
      tasks: done.slice().sort((a, b) => {
        const at = a.done_at ? new Date(a.done_at).getTime() : 0;
        const bt = b.done_at ? new Date(b.done_at).getTime() : 0;
        return bt - at;
      }),
    });
  }

  return sections;
}

export default function TasksPage() {
  const { toast } = useToast();
  const tasks = useTasksStore((s) => s.tasks);
  const toggle = useTasksStore((s) => s.toggle);
  const remove = useTasksStore((s) => s.remove);
  const addManual = useTasksStore((s) => s.addManual);
  const clearDone = useTasksStore((s) => s.clearDone);

  const [newTitle, setNewTitle] = React.useState("");
  const today = React.useMemo(() => new Date(), []);
  const todayKey = ymd(today);

  const sections = React.useMemo(
    () => groupTasks(tasks, today),
    [tasks, today]
  );

  const totalActive = tasks.filter((t) => !t.done).length;
  const totalDone = tasks.filter((t) => t.done).length;

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    addManual(title, todayKey);
    setNewTitle("");
    toast({ title: "أضفنا المهمة لقائمتك", variant: "success" });
  }

  return (
    <AppShellMobile>
      <TopBar title="قائمة مهامي" showBack showSettings />
      <div className="flex flex-col gap-4 px-4 pb-12 pt-4">
        <Card className="flex items-start gap-3 p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700">
            <ListChecks className="h-4 w-4" />
          </span>
          <div className="flex flex-1 flex-col">
            <p className="text-[14px] font-semibold">قائمة بسيطة بدون تقويم</p>
            <p className="text-[12px] text-muted-foreground">
              مهام محفوظة عندك فقط — علّم على المنجز أو احذف ما لم يعد ضرورياً.
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {totalActive} مهمة نشطة • {totalDone} مكتملة
            </p>
          </div>
        </Card>

        <Card className="p-3">
          <form onSubmit={onAdd} className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="أضف مهمة سريعة لليوم…"
              aria-label="مهمة جديدة"
            />
            <Button type="submit" size="md" disabled={!newTitle.trim()}>
              <Plus className="h-4 w-4" />
              أضف
            </Button>
          </form>
        </Card>

        {sections.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-6 text-center">
            <p className="text-[14px] font-medium">قائمتك فاضية</p>
            <p className="text-[12px] text-muted-foreground">
              احفظ خطتك من شاشة المراجعة كقائمة، أو أضف مهمة سريعة من الأعلى.
            </p>
            <Button asChild size="md" variant="soft">
              <Link href="/">ابدأ بكتابة خطة</Link>
            </Button>
          </Card>
        ) : (
          sections.map((sec) => (
            <section key={sec.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[13px] font-semibold text-muted-foreground">
                  {sec.label}
                </h2>
                {sec.key === "_done" && totalDone > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearDone();
                      toast({ title: "مسحنا المكتمل" });
                    }}
                    className="text-[12px] text-primary-700 hover:underline"
                  >
                    مسح المكتمل
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {sec.tasks.map((task) => (
                  <ChecklistItem
                    key={task.id}
                    task={task}
                    onToggle={toggle}
                    onDelete={(id) => {
                      remove(id);
                      toast({ title: "حذفنا المهمة" });
                    }}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </AppShellMobile>
  );
}
