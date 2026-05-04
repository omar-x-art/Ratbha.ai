"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReassureBar } from "@/components/chat/ReassureBar";

interface MessageComposerProps {
  placeholder?: string;
  onSend?: (text: string) => void;
  className?: string;
  showReassure?: boolean;
  reassureText?: string;
  initialValue?: string;
}

export function MessageComposer({
  placeholder = "مثال: عندي اجتماع 2 والجيم بكرة وأخلص التقرير الخميس",
  onSend,
  className,
  showReassure = true,
  reassureText = "لن نحفظ أي شيء في تقويمك قبل مراجعتك.",
  initialValue = "",
}: MessageComposerProps) {
  const [value, setValue] = React.useState(initialValue);
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [value]);

  function send() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend?.(trimmed);
    setValue("");
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
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            dir="auto"
            placeholder={placeholder}
            className="block max-h-40 min-h-[28px] flex-1 resize-none bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
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
