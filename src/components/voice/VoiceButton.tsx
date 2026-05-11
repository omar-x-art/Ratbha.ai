"use client";

import * as React from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  isSupported?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const ICON_SIZE_MAP = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function VoiceButton({
  isListening,
  onStart,
  onStop,
  isSupported = true,
  size = "md",
  className,
}: VoiceButtonProps) {
  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={isListening ? onStop : onStart}
      aria-label={isListening ? "أوقف التسجيل" : "سجّل صوتك"}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full transition-all duration-200",
        SIZE_MAP[size],
        isListening
          ? "bg-danger text-white shadow-lg"
          : "bg-primary-50 text-primary-700 hover:bg-primary-100",
        className
      )}
    >
      {isListening && (
        <>
          <span className="absolute inset-0 animate-ping rounded-full bg-danger/40" />
          <span className="absolute inset-0 animate-pulse rounded-full bg-danger/20" />
        </>
      )}
      {isListening ? (
        <MicOff className={cn(ICON_SIZE_MAP[size], "relative z-10")} />
      ) : (
        <Mic className={cn(ICON_SIZE_MAP[size], "relative z-10")} />
      )}
    </button>
  );
}
