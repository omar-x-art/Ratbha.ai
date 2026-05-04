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
import type { ChatMessage } from "@/lib/types";

export default function ChatHomePage() {
  const router = useRouter();
  const [messages, setMessages] = React.useState<ChatMessage[]>(WELCOME_MESSAGES);
  const [thinking, setThinking] = React.useState(false);

  function go() {
    // Mock "AI proposes plan" → navigate to plan preview
    setTimeout(() => {
      router.push("/plan/preview");
    }, 900);
  }

  function send(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, from: "user", text },
    ]);
    setThinking(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          from: "ai",
          character: "siraj",
          text: "لحظة... أنظّم لك خطة وأعرضها قبل أي حفظ.",
        },
      ]);
      setThinking(false);
      go();
    }, 700);
  }

  function pickChip(chip: Chip) {
    send(chip.label);
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

      <MessageComposer onSend={send} />
    </AppShellMobile>
  );
}
