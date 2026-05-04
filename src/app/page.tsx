"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { ChatThread } from "@/components/chat/ChatThread";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { SuggestionChips, type Chip } from "@/components/chat/SuggestionChips";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { TypingDots } from "@/components/chat/TypingDots";
import { WELCOME_MESSAGES, SUGGESTION_CHIPS } from "@/lib/mock/messages";
import { usePlanStore } from "@/lib/store/plan-store";
import { buildPlanFromExtraction } from "@/lib/pipeline/build-plan";
import type { TaskExtraction } from "@/lib/gemini/schema";
import type { ChatMessage } from "@/lib/types";

interface BusyEvent {
  start: string;
  end: string;
  isMeeting?: boolean;
}

export default function ChatHomePage() {
  const router = useRouter();
  const setPlan = usePlanStore((s) => s.setPlan);
  const setInputText = usePlanStore((s) => s.setInputText);
  const [messages, setMessages] = React.useState<ChatMessage[]>(WELCOME_MESSAGES);
  const [thinking, setThinking] = React.useState(false);

  async function send(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, from: "user", text },
    ]);
    setInputText(text);
    setThinking(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        from: "ai",
        character: "siraj",
        text: "لحظة... أنظّم لك خطة وأعرضها قبل أي حفظ.",
      },
    ]);

    try {
      const [extractionRes, eventsRes] = await Promise.all([
        fetch("/api/ai/parse-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, locale: "ar" }),
        }).then((r) => r.json() as Promise<TaskExtraction>),
        fetch("/api/calendar/events").then(
          (r) => r.json() as Promise<{ events: BusyEvent[] }>
        ),
      ]);

      const busy = (eventsRes.events ?? []).map((e) => ({
        start: new Date(e.start).getTime(),
        end: new Date(e.end).getTime(),
        isMeeting: e.isMeeting,
      }));

      const plan = buildPlanFromExtraction(extractionRes, {
        busy,
        text,
      });
      setPlan(plan);
      router.push("/plan/preview");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-err-${Date.now()}`,
          from: "ai",
          character: "siraj",
          text: "صار خطأ بسيط أثناء بناء الخطة. جرّب تكتب الجملة مرة ثانية.",
        },
      ]);
      setThinking(false);
    }
  }

  function pickChip(chip: Chip) {
    void send(chip.label);
  }

  return (
    <AppShellMobile withComposerSpace>
      <TopBar title="رتّبها" showSettings />
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

      <div className="mb-4">
        <SuggestionChips chips={SUGGESTION_CHIPS} onPick={pickChip} />
      </div>

      <MessageComposer onSend={(t) => void send(t)} />
    </AppShellMobile>
  );
}
