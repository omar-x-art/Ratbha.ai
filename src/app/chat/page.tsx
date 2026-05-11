"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { ChatThread } from "@/components/chat/ChatThread";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { TypingDots } from "@/components/chat/TypingDots";
import type { ChatMessage } from "@/lib/types";

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

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

  React.useEffect(() => {
    if (initialQuery) {
      const timer = setTimeout(() => {
        const q = initialQuery;
        setMessages((prev) => [
          ...prev,
          { id: `u-${Date.now()}`, from: "user", text: q },
        ]);
        setThinking(true);
        setInitialValue("");
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
          setTimeout(() => router.push("/plan/preview"), 900);
        }, 700);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function send(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, from: "user", text },
    ]);
    setThinking(true);
    setInitialValue("");
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
      setTimeout(() => router.push("/plan/preview"), 900);
    }, 700);
  }

  return (
    <>
      <TopBar title="شات" showBack />
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
