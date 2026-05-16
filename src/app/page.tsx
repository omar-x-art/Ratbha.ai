"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Clock,
  ListChecks,
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
import { DayProgressBar } from "@/components/plan/DayProgressBar";
import { useVoiceInput } from "@/lib/hooks/use-voice-input";
import { formatTimeRange } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useTasksStore } from "@/lib/store/tasks-store";
import type { PlanItem } from "@/lib/types";

function findNextUpcomingItem(
  items: PlanItem[],
  itemStatuses: Record<string, string>
): PlanItem | null {
  const now = Date.now();
  const upcoming = items
    .filter(
      (item) =>
        itemStatuses[item.id] !== "done" &&
        new Date(item.start_time).getTime() >= now
    )
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  return upcoming[0] ?? null;
}

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const buckets = useTasksStore((s) => s.buckets);
  const itemStatuses = useTasksStore((s) => s.itemStatuses);
  const markDone = useTasksStore((s) => s.markDone);

  const todayBucket = buckets.find((b) => b.label === "today");
  const todayCount = todayBucket?.items.length ?? 0;
  const allItems = buckets.flatMap((b) => b.items);
  const doneCount = allItems.filter((i) => itemStatuses[i.id] === "done").length;
  const nextItem = findNextUpcomingItem(allItems, itemStatuses);

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
      if (isFinal) {
        toast({ title: `تم التسجيل: "${text}"`, description: "جاري فتح رتّب..." });
        setTimeout(() => router.push(`/chat?q=${encodeURIComponent(text)}`), 800);
      }
    },
  });

  function toggleVoice() {
    if (isListening) {
      stopListening();
      resetTranscript();
    } else {
      startListening();
    }
  }

  function markNextDone(item: PlanItem) {
    markDone(item.id);
    toast({ title: `تم إنجاز: ${item.title}`, variant: "success" });
  }

  return (
    <AppShellMobile withBottomNav>
      <div className="flex flex-col gap-5 px-4 pb-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CharacterAvatar who="siraj" state="happy" size={52} />
            <div>
              <h1 className="text-[22px] font-bold leading-tight">أهلًا بك</h1>
              <p className="text-[13px] text-muted-foreground">{today}</p>
            </div>
          </div>
          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
          >
            <Sparkles className="h-4 w-4" />
          </Link>
        </div>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[14px] font-semibold">تقدم اليوم</span>
            <Link href="/today" className="flex items-center gap-1 text-[12px] text-primary-700 hover:underline">
              <span>عرض الكل</span>
              <ChevronLeft className="h-3 w-3" />
            </Link>
          </div>
          <DayProgressBar total={allItems.length} done={doneCount} />
        </Card>

        {nextItem && (
          <Card className="border-primary-100 bg-primary-50/40 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary-600" />
              <span className="text-[12px] font-semibold text-primary-700">
                المهمة التالية
              </span>
            </div>
            <h3 className="text-[18px] font-bold">{nextItem.title}</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {formatTimeRange(nextItem.start_time, nextItem.end_time)}
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => markNextDone(nextItem)}>
                <ListChecks className="h-4 w-4" />
                تم
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/today")}
              >
                عرض يومي
              </Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-3 gap-3">
          <Link href="/today">
            <Card className="flex flex-col items-center gap-1 p-4 text-center">
              <span className="text-[24px] font-bold text-primary-600">{todayCount}</span>
              <span className="text-[11px] text-muted-foreground">مهام اليوم</span>
            </Card>
          </Link>
          <Link href="/chat">
            <Card className="flex flex-col items-center gap-1 p-4 text-center">
              <Sparkles className="h-6 w-6 text-primary-600" />
              <span className="text-[11px] text-muted-foreground">رتّب</span>
            </Card>
          </Link>
          <Link href="/settings">
            <Card className="flex flex-col items-center gap-1 p-4 text-center">
              <Settings className="h-6 w-6 text-primary-600" />
              <span className="text-[11px] text-muted-foreground">الإعدادات</span>
            </Card>
          </Link>
        </div>

        <Card className="flex flex-col items-center gap-3 p-6">
          <CharacterAvatar who="siraj" state="encouraging" size={64} />
          <p className="text-center text-[15px] font-semibold">
            قولي وش عندك وأرتّب لك
          </p>
          <p className="text-center text-[12px] text-muted-foreground">
            اضغط الميكروفون أو اكتب مهامك
          </p>
          <VoiceTranscriptOverlay
            interimTranscript={interimTranscript}
            isListening={isListening}
          />
          <div className="flex items-center gap-3">
            {voiceSupported && (
              <VoiceButton
                isListening={isListening}
                onStart={toggleVoice}
                onStop={toggleVoice}
                size="lg"
              />
            )}
            <Button asChild size="lg">
              <Link href="/chat">
                <Plus className="h-4 w-4" />
                اكتب مهامك
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      <BottomNav />
    </AppShellMobile>
  );
}
