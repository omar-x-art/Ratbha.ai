"use client";

import * as React from "react";
import { CalendarClock, Send } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { BottomNav } from "@/components/shell/BottomNav";
import { PullToRefresh } from "@/components/shell/PullToRefresh";
import { GroupHeader } from "@/components/plan/GroupHeader";
import { SwipeableTaskItem } from "@/components/plan/SwipeableTaskItem";
import { NextTaskWidget } from "@/components/plan/NextTaskWidget";
import { DayProgressBar } from "@/components/plan/DayProgressBar";
import { TaskActionsSheet } from "@/components/plan/TaskActionsSheet";
import { StatusPickerSheet } from "@/components/plan/StatusPickerSheet";
import { BottomSheetEditTask } from "@/components/plan/BottomSheetEditTask";
import { SkeletonGroup } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { MetricsStrip } from "@/components/insights/MetricsStrip";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { VoiceTranscriptOverlay } from "@/components/voice/VoiceTranscriptOverlay";
import { useVoiceInput } from "@/lib/hooks/use-voice-input";
import { useTasksStore } from "@/lib/store/tasks-store";
import type { DayBucket, PillStatus, PlanItem } from "@/lib/types";

interface QuickTaskDraft {
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
}

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toTimeInput(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getDefaultDraft(): QuickTaskDraft {
  const start = new Date();
  const roundedMinutes = Math.ceil(start.getMinutes() / 30) * 30;
  start.setMinutes(roundedMinutes, 0, 0);
  start.setTime(start.getTime() + 30 * 60 * 1000);

  return {
    title: "",
    date: toDateInput(start),
    time: toTimeInput(start),
    durationMinutes: 30,
  };
}

function getEmptyDraft(): QuickTaskDraft {
  return {
    title: "",
    date: "",
    time: "",
    durationMinutes: 30,
  };
}

function getUpcomingItem(items: PlanItem[], itemStatuses: Record<string, PillStatus>) {
  const now = Date.now();
  return (
    [...items]
      .filter(
        (item) =>
          itemStatuses[item.id] !== "done" &&
          new Date(item.end_time).getTime() >= now
      )
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )[0] ?? null
  );
}

function getItemMinutes(item: PlanItem) {
  const start = new Date(item.start_time).getTime();
  const end = new Date(item.end_time).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}د`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}س ${rest}د` : `${hours}س`;
}

export default function TodayPage() {
  const { toast } = useToast();

  const buckets = useTasksStore((s) => s.buckets);
  const itemStatuses = useTasksStore((s) => s.itemStatuses);
  const updateItem = useTasksStore((s) => s.updateItem);
  const removeItem = useTasksStore((s) => s.removeItem);
  const postponeItem = useTasksStore((s) => s.postponeItem);
  const markDone = useTasksStore((s) => s.markDone);
  const setItemStatus = useTasksStore((s) => s.setItemStatus);
  const addQuickItem = useTasksStore((s) => s.addQuickItem);

  const [ready, setReady] = React.useState(false);
  const [draft, setDraft] = React.useState<QuickTaskDraft>(() => getEmptyDraft());
  const [loading, setLoading] = React.useState(false);
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

  const allItems = React.useMemo(
    () =>
      buckets
        .flatMap((b) => b.items)
        .sort(
          (a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        ),
    [buckets]
  );
  const todayBucket = buckets.find((b) => b.label === "today");
  const tomorrowBucket = buckets.find((b) => b.label === "tomorrow");
  const laterBuckets = buckets.filter(
    (b) => b.label !== "today" && b.label !== "tomorrow"
  );
  const summaryItems = todayBucket?.items.length ? todayBucket.items : allItems;
  const doneCount = summaryItems.filter(
    (i) => itemStatuses[i.id] === "done"
  ).length;
  const remainingCount = Math.max(0, summaryItems.length - doneCount);
  const scheduledMinutes = summaryItems.reduce(
    (total, item) => total + getItemMinutes(item),
    0
  );
  const nextItem = getUpcomingItem(allItems, itemStatuses);

  React.useEffect(() => {
    setDraft((current) => (current.date && current.time ? current : getDefaultDraft()));
    setReady(true);
  }, []);

  function getItemStatus(item: PlanItem): PillStatus {
    if (itemStatuses[item.id]) return itemStatuses[item.id];
    if (item.is_locked) return "active";
    return "planned";
  }

  function openEdit(item: PlanItem) {
    setEditing(item);
    setEditOpen(true);
  }

  function handleDone(item: PlanItem) {
    markDone(item.id);
    toast({ title: `تم إنجاز: ${item.title}`, variant: "success" });
  }

  function handleDelete(item: PlanItem) {
    removeItem(item.id);
    toast({ title: `تم حذف: ${item.title}`, variant: "danger" });
  }

  function handlePostpone(id: string) {
    postponeItem(id);
    toast({ title: "تم نقل المهمة للغد" });
  }

  function handleStatusPick(status: PillStatus) {
    if (!statusSheet.item) return;
    setItemStatus(statusSheet.item.id, status);
    toast({ title: "تم تغيير الحالة" });
    setStatusSheet({ open: false, item: null });
  }

  async function refresh() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast({ title: "تم التحديث", variant: "success" });
  }

  function handleQuickTaskSend(nextDraft: QuickTaskDraft) {
    const title = nextDraft.title.trim();
    if (!title) return;

    addQuickItem(title, {
      date: nextDraft.date,
      time: nextDraft.time,
      durationMinutes: nextDraft.durationMinutes,
    });
    toast({
      title: "تمت إضافة المهمة",
      description: "ستظهر في اليوم والتقويم حسب وقتها المحدد.",
      variant: "success",
    });
    setDraft({ ...getDefaultDraft(), title: "" });
  }

  function renderBucket(
    bucket: DayBucket,
    color: "primary" | "warning" | "secondary",
    showAdd?: boolean
  ) {
    if (bucket.items.length === 0) return null;
    return (
      <GroupHeader
        key={bucket.date}
        label={bucket.arabicLabel}
        count={bucket.items.length}
        color={color}
        onAdd={
          showAdd
            ? () =>
                document
                  .getElementById("quick-task-title")
                  ?.focus({ preventScroll: false })
            : undefined
        }
      >
        {bucket.items.map((planItem) => (
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
      <TopBar title="لوحة اليوم" showSettings className="bg-surface/90" />

      <PullToRefresh onRefresh={refresh}>
        <div className="flex flex-col gap-3 px-3 pb-8 pt-3">
          {!ready ? (
            <>
              <SkeletonGroup count={2} />
              <SkeletonGroup count={1} />
            </>
          ) : (
            <>
              <TodayBoardSummary
                total={summaryItems.length}
                done={doneCount}
                remaining={remainingCount}
                scheduledMinutes={scheduledMinutes}
              />

              <NextTaskWidget
                item={nextItem}
                onDone={() => {
                  if (nextItem) handleDone(nextItem);
                }}
                onPostpone={() => {
                  if (nextItem) handlePostpone(nextItem.id);
                }}
                onReorganize={() => {
                  if (nextItem) openEdit(nextItem);
                }}
              />

              <SirajTodayComposer
                draft={draft}
                onChange={setDraft}
                onSend={handleQuickTaskSend}
              />

              <div className="mt-1 flex items-center justify-between px-1">
                <h2 className="text-[15px] font-bold">المهام</h2>
                <span className="rounded-[7px] bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                  {allItems.length} عنصر
                </span>
              </div>

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
                  {allItems.length === 0 && (
                    <Card className="border-dashed bg-surface p-4 text-center shadow-none">
                      <p className="text-[15px] font-bold">
                        يومك جاهز للترتيب
                      </p>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        أضف مهمة بوقتها لتظهر في اليوم والتقويم.
                      </p>
                    </Card>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </PullToRefresh>

      <BottomNav />

      <BottomSheetEditTask
        open={editOpen}
        onOpenChange={setEditOpen}
        item={editing}
        onSave={(item) => {
          updateItem(item.id, item);
          setEditOpen(false);
        }}
        onDelete={(id) => {
          removeItem(id);
          setEditOpen(false);
        }}
        onPostpone={(id) => {
          handlePostpone(id);
          setEditOpen(false);
        }}
      />

      <TaskActionsSheet
        open={actionsSheet.open}
        onOpenChange={(o) => setActionsSheet((p) => ({ ...p, open: o }))}
        item={actionsSheet.item}
        onEdit={openEdit}
        onPostpone={(id) => handlePostpone(id)}
        onDelete={(id) => removeItem(id)}
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

function TodayBoardSummary({
  total,
  done,
  remaining,
  scheduledMinutes,
}: {
  total: number;
  done: number;
  remaining: number;
  scheduledMinutes: number;
}) {
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const metrics = [
    { label: "منجز", value: `${done}`, tone: "emerald" as const },
    { label: "متبقي", value: `${remaining}`, tone: "amber" as const },
    {
      label: "وقت مجدول",
      value: formatMinutes(scheduledMinutes),
      tone: "violet" as const,
    },
  ];

  return (
    <section className="rounded-[18px] border border-border bg-surface p-3 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-sky-700">لوحة اليوم</p>
          <h1 className="mt-0.5 text-[22px] font-black leading-tight">
            {progress}% منجز
          </h1>
        </div>
        <span className="flex h-10 min-w-10 items-center justify-center rounded-[12px] bg-sky-50 px-3 text-[14px] font-black text-sky-900">
          {done}/{total}
        </span>
      </div>

      <DayProgressBar total={total} done={done} showCount={false} className="mt-3" />

      <MetricsStrip className="mt-3" items={metrics} />
    </section>
  );
}

function SirajTodayComposer({
  draft,
  onChange,
  onSend,
}: {
  draft: QuickTaskDraft;
  onChange: (value: QuickTaskDraft) => void;
  onSend: (value: QuickTaskDraft) => void;
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const {
    isListening,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({
    lang: "ar-SA",
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (!isFinal) return;
      onChange({
        ...draft,
        title: draft.title.trimEnd() ? `${draft.title.trimEnd()} ${text}` : text,
      });
    },
  });

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
  }, [draft.title]);

  function send() {
    if (!draft.title.trim()) return;
    if (isListening) stopListening();
    onSend(draft);
    resetTranscript();
  }

  function toggleVoice() {
    if (isListening) {
      stopListening();
      return;
    }

    resetTranscript();
    startListening();
  }

  return (
    <Card className="border-border bg-surface p-0 shadow-card">
      <VoiceTranscriptOverlay
        interimTranscript={interimTranscript}
        isListening={isListening}
      />

      <div className="px-3 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="rounded-[7px] bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-900">
            إضافة سريعة
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground">
            الوقت يظهر في التقويم
          </span>
        </div>

        <div className="flex items-end gap-2 rounded-[14px] border border-border bg-background/70 px-2.5 py-2">
          <VoiceButton
            isListening={isListening}
            onStart={toggleVoice}
            onStop={toggleVoice}
            isSupported={isSupported}
            size="sm"
          />
          <textarea
            id="quick-task-title"
            ref={textareaRef}
            value={draft.title}
            onChange={(event) => onChange({ ...draft, title: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            rows={1}
            dir="auto"
            placeholder="اكتب مهمة جديدة"
            className="block max-h-24 min-h-[28px] flex-1 resize-none bg-transparent text-[15px] font-semibold text-foreground placeholder:font-medium placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.title.trim()}
            aria-label="إضافة"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-sky-500 text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4 rotate-180" />
          </button>
        </div>

        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_80px_72px] gap-1.5">
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-bold text-muted-foreground">
              تاريخ
            </span>
            <input
              type="date"
              value={draft.date}
              onChange={(event) => onChange({ ...draft, date: event.target.value })}
              className="h-9 min-w-0 rounded-[10px] border border-border bg-background/70 px-2 text-[12px] font-semibold outline-none focus:border-sky-300"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-bold text-muted-foreground">
              وقت
            </span>
            <input
              type="time"
              value={draft.time}
              onChange={(event) => onChange({ ...draft, time: event.target.value })}
              className="h-9 min-w-0 rounded-[10px] border border-border bg-background/70 px-2 text-[12px] font-semibold outline-none focus:border-sky-300"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-bold text-muted-foreground">
              مدة
            </span>
            <div className="flex h-9 items-center rounded-[10px] border border-border bg-background/70 px-1.5 focus-within:border-sky-300">
              <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                type="number"
                inputMode="numeric"
                min={5}
                step={5}
                value={draft.durationMinutes}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    durationMinutes: Number(event.target.value) || 30,
                  })
                }
                className="min-w-0 flex-1 bg-transparent text-center text-[12px] font-semibold outline-none"
              />
            </div>
          </label>
        </div>
      </div>
    </Card>
  );
}
