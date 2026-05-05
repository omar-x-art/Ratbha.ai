"use client";

import * as React from "react";
import { Mic, MicOff, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReassureBar } from "@/components/chat/ReassureBar";
import { useSpeechRecognition } from "@/lib/hooks/use-speech-recognition";
import { useToast } from "@/components/ui/use-toast";

interface MessageComposerProps {
  placeholder?: string;
  onSend?: (text: string) => void;
  className?: string;
  showReassure?: boolean;
  reassureText?: string;
  initialValue?: string;
}

export function MessageComposer({
  placeholder = "اكتب أو اضغط المايك للتحدث",
  onSend,
  className,
  showReassure = true,
  reassureText = "لن نحفظ أي شيء في تقويمك قبل مراجعتك.",
  initialValue = "",
}: MessageComposerProps) {
  const { toast } = useToast();
  const [value, setValue] = React.useState(initialValue);
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  // Snapshot of the input before the active speech session started. Interim
  // transcripts are rendered as `base + " " + interim` so partial speech
  // doesn't permanently overwrite anything the user already typed.
  const baseRef = React.useRef("");

  const speech = useSpeechRecognition({
    lang: "ar-SA",
    onTranscript: (text, isFinal) => {
      const trimmed = text.trim();
      if (isFinal) {
        const merged = baseRef.current
          ? `${baseRef.current} ${trimmed}`.trim()
          : trimmed;
        baseRef.current = merged;
        setValue(merged);
      } else {
        const merged = baseRef.current
          ? `${baseRef.current} ${trimmed}`.trim()
          : trimmed;
        setValue(merged);
      }
    },
    onError: (err) => {
      if (err === "not-allowed" || err === "service-not-allowed") {
        toast({
          title: "المايك مرفوض",
          description: "اسمح بالمايك من إعدادات المتصفح ثم جرّب مرة ثانية.",
          variant: "danger",
        });
      } else if (err === "no-speech") {
        // benign — user didn't say anything
      } else if (err !== "aborted") {
        toast({
          title: "خطأ في المايك",
          description: "أعد المحاولة، أو اكتب الجملة يدوياً.",
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

  function send() {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (speech.isListening) speech.stop();
    onSend?.(trimmed);
    setValue("");
    baseRef.current = "";
  }

  function toggleMic() {
    if (speech.status === "denied") {
      toast({
        title: "المايك مرفوض",
        description: "اسمح بالمايك من إعدادات المتصفح ثم أعد تحميل الصفحة.",
        variant: "danger",
      });
      return;
    }
    if (!speech.isListening) {
      // Snapshot what the user has typed so far before recording starts.
      baseRef.current = value;
    }
    speech.toggle();
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto w-full max-w-[480px] px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
        <div className="flex items-end gap-2 rounded-composer border border-border bg-surface px-3 py-2 shadow-card">
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (!speech.isListening) baseRef.current = e.target.value;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            dir="auto"
            placeholder={
              speech.isListening ? "أتحدث الآن... تكلّم" : placeholder
            }
            className="block max-h-40 min-h-[28px] flex-1 resize-none bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {speech.isSupported && (
            <button
              type="button"
              onClick={toggleMic}
              aria-label={
                speech.isListening ? "أوقف التسجيل" : "تكلّم بدل الكتابة"
              }
              aria-pressed={speech.isListening}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                speech.isListening
                  ? "bg-danger text-white animate-pulse"
                  : speech.status === "denied"
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary-50 text-primary-700 hover:bg-primary-100"
              )}
            >
              {speech.status === "denied" ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={send}
            disabled={!value.trim()}
            aria-label="إرسال"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {/* In RTL, sending visually points left */}
            <Send className="h-4 w-4 rotate-180" />
          </button>
        </div>
        {showReassure && (
          <ReassureBar className="mt-2 px-1 text-center">{reassureText}</ReassureBar>
        )}
      </div>
    </div>
  );
}
