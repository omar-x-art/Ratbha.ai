"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { BottomNav } from "@/components/shell/BottomNav";
import { QuickFindBar } from "@/components/shell/QuickFindBar";
import { PullToRefresh } from "@/components/shell/PullToRefresh";
import { CharacterAvatar } from "@/components/characters/CharacterAvatar";
import { GroupHeader } from "@/components/plan/GroupHeader";
import { SwipeableTaskItem } from "@/components/plan/SwipeableTaskItem";
import { NextTaskWidget } from "@/components/plan/NextTaskWidget";
import { DayProgressBar } from "@/components/plan/DayProgressBar";
import { TaskActionsSheet } from "@/components/plan/TaskActionsSheet";
import { StatusPickerSheet } from "@/components/plan/StatusPickerSheet";
import { SkeletonGroup } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { VoiceTranscriptOverlay } from "@/components/voice/VoiceTranscriptOverlay";
import { useVoiceInput } from "@/lib/hooks/use-voice-input";
import { useTasksStore } from "@/lib/store/tasks-store";
import type { PillStatus, PlanItem } from "@/lib/types";

export default function TodayPage() {
  const router = useRouter();
  const { toast } = useToast();

  const buckets = useTasksStore((s) => s.buckets);
  const itemStatuses = useTasksStore((s) => s.itemStatuses);
  const removeItem = useTasksStore((s) => s.removeItem);
  const postponeItem = useTasksStore((s) => s.postponeItem);
  const markDone = useTasksStore((s) => s.markDone);
  const setItemStatus = useTasksStore((s) => s.setItemStatus);
  const addQuickItem = useTasksStore((s) => s.addQuickItem);

  const [search, setSearch] = React.useState("");
  const [sirajText, setSirajText] = React.useState("");
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

  function handleSirajSend(text: string) {
    addQuickItem(text);
    toast({
      title: "أضفتها ليومك",
      description: "سراج حطها في خطة اليوم ويمكنك تعديلها الآن.",
      variant: "success",
    });
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
        key={bucket.date}
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
            onReorganize={() => router.push("/chat")}
          />

          <SirajTodayComposer
            value={sirajText}
            onChange={setSirajText}
            onSend={handleSirajSend}
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
              {allItems.length === 0 && !search && (
                <Card className="border-primary-100 bg-primary-50/35 text-center">
                  <p className="text-[15px] font-semibold">
                    يومك جاهز للترتيب
                  </p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    اكتب أول مهمة لسراج بالأعلى، وستظهر هنا مباشرة.
                  </p>
                </Card>
              )}
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

function SirajTodayComposer({
  value,
  onChange,
  onSend,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: (value: string) => void;
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
      onChange(value.trimEnd() ? `${value.trimEnd()} ${text}` : text);
    },
  });

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
  }, [value]);

  function send() {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (isListening) stopListening();
    onSend(trimmed);
    onChange("");
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
    <Card className="flex flex-col gap-3 border-primary-100 bg-primary-50/35">
      <div className="flex items-center gap-3">
        <CharacterAvatar who="siraj" state="thinking" size={40} />
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold">رتّب مع سراج</span>
          <span className="text-[12px] text-muted-foreground">
            اكتب مهمة أو قلها بصوتك
          </span>
        </div>
      </div>

      <VoiceTranscriptOverlay
        interimTranscript={interimTranscript}
        isListening={isListening}
      />

      <div className="flex items-end gap-2 rounded-composer border border-border bg-surface px-3 py-2 shadow-card">
        {isSupported && (
          <VoiceButton
            isListening={isListening}
            onStart={toggleVoice}
            onStop={toggleVoice}
            size="sm"
          />
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          rows={1}
          dir="auto"
          placeholder="مثال: راجع العرض الساعة ٥"
          className="block max-h-28 min-h-[28px] flex-1 resize-none bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="button"
          onClick={send}
          disabled={!value.trim()}
          aria-label="إضافة"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4 rotate-180" />
        </button>
      </div>
    </Card>
  );
}
