"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReassureBar } from "@/components/chat/ReassureBar";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { VoiceTranscriptOverlay } from "@/components/voice/VoiceTranscriptOverlay";
import { useVoiceInput } from "@/lib/hooks/use-voice-input";

interface MessageComposerProps {
  placeholder?: string;
  onSend?: (text: string) => void;
  className?: string;
  showReassure?: boolean;
  reassureText?: string;
  initialValue?: string;
  withVoice?: boolean;
}

export function MessageComposer({
  placeholder = "مثال: عندي اجتماع 2 والجيم بكرة وأخلص التقرير الخميس",
  onSend,
  className,
  showReassure = false,
  reassureText = "لن نحفظ أي شيء في تقويمك قبل مراجعتك.",
  initialValue = "",
  withVoice = true,
}: MessageComposerProps) {
  const [value, setValue] = React.useState(initialValue);
  const taRef = React.useRef<HTMLTextAreaElement>(null);

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
        setValue((prev) => {
          const base = prev.trimEnd();
          return base ? `${base} ${text}` : text;
        });
      }
    },
  });

  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [value]);

  React.useEffect(() => {
    if (isListening && taRef.current) {
      taRef.current.focus();
    }
  }, [isListening]);

  function send() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend?.(trimmed);
    setValue("");
    resetTranscript();
  }

  function toggleVoice() {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto w-full max-w-[480px] px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
        <VoiceTranscriptOverlay
          interimTranscript={interimTranscript}
          isListening={isListening}
          className="mb-2"
        />
        <div
          className={cn(
            "flex items-end gap-2 rounded-composer border bg-surface px-3 py-2 shadow-card transition-colors",
            isListening
              ? "border-danger/50 ring-2 ring-danger/20"
              : "border-border"
          )}
        >
          {withVoice && voiceSupported && (
            <VoiceButton
              isListening={isListening}
              onStart={toggleVoice}
              onStop={toggleVoice}
              size="sm"
            />
          )}
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (isListening) stopListening();
                send();
              }
            }}
            rows={1}
            dir="auto"
            placeholder={
              isListening ? "يتحدث الآن..." : placeholder
            }
            className="block max-h-40 min-h-[28px] flex-1 resize-none bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (isListening) stopListening();
              send();
            }}
            disabled={!value.trim()}
            aria-label="إرسال"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4 rotate-180" />
          </button>
        </div>
        {showReassure && (
          <ReassureBar className="mt-2 px-1 text-center">
            {reassureText}
          </ReassureBar>
        )}
      </div>
    </div>
  );
}
