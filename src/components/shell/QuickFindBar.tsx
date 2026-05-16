"use client";

import * as React from "react";
import { Filter, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { useVoiceInput } from "@/lib/hooks/use-voice-input";

interface QuickFindBarProps {
  value?: string;
  onChange?: (v: string) => void;
  onFilter?: () => void;
  onAdd?: () => void;
  placeholder?: string;
  withVoice?: boolean;
  className?: string;
}

export function QuickFindBar({
  value = "",
  onChange,
  onFilter,
  onAdd,
  placeholder = "ابحث في مهامك...",
  withVoice = true,
  className,
}: QuickFindBarProps) {
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
      onChange?.(text);
      if (isFinal) {
        stopListening();
        resetTranscript();
      }
    },
  });

  function toggleVoice() {
    if (isListening) {
      stopListening();
      resetTranscript();
      return;
    }

    onChange?.("");
    startListening();
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-composer border bg-surface px-3 py-2 shadow-card transition-colors",
          isListening ? "border-danger/50 ring-2 ring-danger/20" : "border-border"
        )}
      >
        {isListening ? (
          <VoiceButton
            isListening={isListening}
            onStart={toggleVoice}
            onStop={toggleVoice}
            size="sm"
          />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <input
          type="text"
          value={isListening && interimTranscript ? interimTranscript : value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={isListening ? "يتحدث الآن..." : placeholder}
          className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
        />
        {withVoice && !isListening && (
          <VoiceButton
            isListening={false}
            onStart={toggleVoice}
            onStop={toggleVoice}
            isSupported={voiceSupported}
            size="sm"
          />
        )}
        {onFilter && (
          <button
            type="button"
            onClick={onFilter}
            aria-label="تصفية"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <Filter className="h-4 w-4" />
          </button>
        )}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            aria-label="إضافة مهمة"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
