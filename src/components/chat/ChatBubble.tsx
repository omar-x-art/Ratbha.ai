import * as React from "react";
import { cn } from "@/lib/utils";
import { CharacterAvatar } from "@/components/characters/CharacterAvatar";
import type { BubbleFrom, CharacterId, CharacterState } from "@/lib/types";

interface ChatBubbleProps {
  from: BubbleFrom;
  character?: CharacterId;
  characterState?: CharacterState;
  children: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function ChatBubble({
  from,
  character = "siraj",
  characterState = "neutral",
  children,
  meta,
  className,
}: ChatBubbleProps) {
  if (from === "system") {
    return (
      <div className={cn("flex justify-center", className)}>
        <div className="rounded-card bg-bubble-system px-3 py-1.5 text-[12px] text-muted-foreground">
          {children}
        </div>
      </div>
    );
  }

  const isUser = from === "user";

  return (
    <div
      className={cn(
        "flex w-full animate-fade-in-up gap-2",
        isUser ? "flex-row-reverse" : "flex-row",
        className
      )}
    >
      {!isUser && (
        <CharacterAvatar
          who={character}
          state={characterState}
          size={32}
          showHalo={false}
        />
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-bubble px-4 py-2.5 text-[15px] leading-relaxed shadow-card",
          isUser
            ? "bg-bubble-user text-foreground"
            : "border border-border bg-bubble-ai text-foreground"
        )}
      >
        {children}
        {meta && (
          <div className="mt-1 text-[11px] text-muted-foreground">{meta}</div>
        )}
      </div>
    </div>
  );
}
