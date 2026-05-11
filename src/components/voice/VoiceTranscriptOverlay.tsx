"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface VoiceTranscriptOverlayProps {
  interimTranscript: string;
  isListening: boolean;
  className?: string;
}

export function VoiceTranscriptOverlay({
  interimTranscript,
  isListening,
  className,
}: VoiceTranscriptOverlayProps) {
  if (!isListening || !interimTranscript) return null;

  return (
    <div
      className={cn(
        "rounded-composer bg-primary-50/90 px-4 py-2 text-center backdrop-blur",
        className
      )}
    >
      <p className="text-[13px] text-primary-700">
        {interimTranscript}
        <span className="animate-pulse">|</span>
      </p>
    </div>
  );
}
