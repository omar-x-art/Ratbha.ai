"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  LayoutGrid,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { BottomNav } from "@/components/shell/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CharacterAvatar } from "@/components/characters/CharacterAvatar";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { VoiceTranscriptOverlay } from "@/components/voice/VoiceTranscriptOverlay";
import { useVoiceInput } from "@/lib/hooks/use-voice-input";
import { formatTimeRange } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useTasksStore } from "@/lib/store/tasks-store";
import type { PillStatus, PlanItem } from "@/lib/types";

function findNextUpcomingItem(
  items: PlanItem[],
  itemStatuses: Record<string, PillStatus>
): PlanItem | null {
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

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const buckets = useTasksStore((s) => s.buckets);
  const itemStatuses = useTasksStore((s) => s.itemStatuses);
  const markDone = useTasksStore((s) => s.markDone);

  const todayBucket = buckets.find((b) => b.label === "today");
  const todayItems = todayBucket?.items ?? [];
  const allItems = buckets.flatMap((b) => b.items);
  const nextItem =
    findNextUpcomingItem(todayItems, itemStatuses) ??
    findNextUpcomingItem(allItems, itemStatuses);

  const today = new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const {
    isListening,
    interimTranscript,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({
    lang: "ar-SA",
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (!isFinal) return;
      toast({ title: `تم التسجيل: "${text}"` });
      setTimeout(() => router.push(`/chat?q=${encodeURIComponent(text)}`), 800);
    },
  });

  function toggleVoice() {
    if (isListening) {
      stopListening();
      resetTranscript();
      return;
    }

    startListening();
  }

  function markNextDone(item: PlanItem) {
    markDone(item.id);
    toast({ title: `تم إنجاز: ${item.title}`, variant: "success" });
  }

  return (
    <AppShellMobile withBottomNav>
      <div className="flex flex-col gap-3 px-3 pb-8 pt-4">
        <div className="flex items-start justify-between gap-3 px-1">
          <div className="flex min-w-0 items-center gap-3">
            <CharacterAvatar who="siraj" state="happy" size={44} />
            <div className="min-w-0">
              <h1 className="text-[24px] font-black leading-tight">رتّبها</h1>
              <p className="mt-0.5 text-[13px] font-semibold text-muted-foreground">
                {today}
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            aria-label="الإعدادات"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-border bg-surface text-muted-foreground shadow-card transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>

        <Card className="relative overflow-hidden p-0">
          <span className="absolute inset-y-3 start-0 w-1 rounded-e-full bg-sky-500" />
          {nextItem ? (
            <div className="px-3 py-3 ps-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-[7px] bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-900">
                      التالية
                    </span>
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatTimeRange(nextItem.start_time, nextItem.end_time)}
                    </span>
                  </div>
                  <h2 className="line-clamp-2 text-[18px] font-black leading-snug">
                    {nextItem.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => markNextDone(nextItem)}
                  aria-label="إنجاز المهمة"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-emerald-500 text-white shadow-card transition-colors hover:bg-emerald-600"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  onClick={() => router.push("/today")}
                  className="h-9 justify-center rounded-[10px] text-[13px]"
                  size="sm"
                >
                  <LayoutGrid className="h-4 w-4" />
                  فتح اليوم
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/calendar")}
                  className="h-9 justify-center rounded-[10px] text-[13px]"
                  size="sm"
                >
                  <CalendarDays className="h-4 w-4" />
                  التقويم
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-3 py-3 ps-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-sky-50 text-sky-700">
                <Clock3 className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-[15px] font-black">لا توجد مهمة قادمة الآن</h2>
                <p className="text-[12px] text-muted-foreground">
                  أضف مهمة بوقت محدد لتظهر هنا.
                </p>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-3">
          <VoiceTranscriptOverlay
            interimTranscript={interimTranscript}
            isListening={isListening}
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <VoiceButton
                isListening={isListening}
                onStart={toggleVoice}
                onStop={toggleVoice}
                isSupported={voiceSupported}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-[14px] font-bold">إضافة بالصوت</p>
                <p className="truncate text-[12px] text-muted-foreground">
                  قل المهمة ثم راجعها في الشات
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="h-9 rounded-[10px]">
              <Link href="/today">
                <Plus className="h-4 w-4" />
                مهمة
              </Link>
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <QuickLink href="/today" icon={<LayoutGrid className="h-4 w-4" />} label="يومي" />
          <QuickLink href="/calendar" icon={<CalendarDays className="h-4 w-4" />} label="التقويم" />
          <QuickLink href="/chat" icon={<Sparkles className="h-4 w-4" />} label="رتّب" />
          <QuickLink href="/settings" icon={<Settings className="h-4 w-4" />} label="الإعدادات" />
        </div>
      </div>

      <BottomNav />
    </AppShellMobile>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-2 rounded-[14px] border border-border bg-surface px-3 py-3 text-[14px] font-bold shadow-card transition-colors hover:bg-muted"
    >
      <span>{label}</span>
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-background text-muted-foreground">
        {icon}
      </span>
      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
