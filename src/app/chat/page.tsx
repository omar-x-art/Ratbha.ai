"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { ChatThread } from "@/components/chat/ChatThread";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { TypingDots } from "@/components/chat/TypingDots";
import { PlanReviewSheet } from "@/components/plan/PlanReviewSheet";
import { useToast } from "@/components/ui/use-toast";
import { useTasksStore } from "@/lib/store/tasks-store";
import type { ChatMessage, Plan } from "@/lib/types";

interface ParseTasksResponse {
  plan: Plan;
}

function ChatContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const setPlan = useTasksStore((s) => s.setPlan);

  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "m-welcome",
      from: "ai",
      character: "siraj",
      text: "أهلًا، اكتب اللي في بالك وسأرتّبه لك.",
    },
  ]);
  const [thinking, setThinking] = React.useState(false);
  const [initialValue, setInitialValue] = React.useState(initialQuery);
  const [planSheetOpen, setPlanSheetOpen] = React.useState(false);

  const processText = React.useCallback(async (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, from: "user", text },
    ]);
    setThinking(true);
    setInitialValue("");
    try {
      const response = await fetch("/api/ai/parse-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: "ar",
        }),
      });

      if (!response.ok) throw new Error("parse_failed");

      const data = (await response.json()) as ParseTasksResponse;
      setPlan(data.plan);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          from: "ai",
          character: "siraj",
          text: "رتّبت لك مسودة خطة. راجعها هنا قبل أي حفظ.",
        },
      ]);
      setThinking(false);
      setPlanSheetOpen(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          from: "ai",
          character: "siraj",
          text: "لم أقدر أرتّب النص الآن. جرّب تكتبه كمهام قصيرة.",
        },
      ]);
      setThinking(false);
    }
  }, [setPlan]);

  React.useEffect(() => {
    if (!initialQuery) return undefined;

    const timer = setTimeout(() => {
      processText(initialQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [initialQuery, processText]);

  function send(text: string) {
    processText(text);
  }

  function approvePlan() {
    setPlanSheetOpen(false);
    toast({
      title: "تم اعتماد الخطة",
      description: "رجعناك ليومك لتتابع التنفيذ.",
      variant: "success",
    });
    router.push("/today");
  }

  return (
    <>
      <TopBar title="رتّب" showBack />
      <ChatThread>
        {messages.map((m) => (
          <ChatBubble
            key={m.id}
            from={m.from}
            character={m.character}
            characterState={m.from === "ai" ? "happy" : "neutral"}
          >
            {m.text}
          </ChatBubble>
        ))}
        {thinking && (
          <ChatBubble from="ai" character="siraj" characterState="thinking">
            <TypingDots />
          </ChatBubble>
        )}
      </ChatThread>
      <MessageComposer
        onSend={send}
        initialValue={initialValue}
        withVoice={true}
      />
      <PlanReviewSheet
        open={planSheetOpen}
        onOpenChange={setPlanSheetOpen}
        onApprove={approvePlan}
      />
    </>
  );
}

export default function ChatPage() {
  return (
    <AppShellMobile withComposerSpace>
      <React.Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        }
      >
        <ChatContent />
      </React.Suspense>
    </AppShellMobile>
  );
}
