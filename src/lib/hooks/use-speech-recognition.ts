"use client";

import * as React from "react";

/**
 * Browser SpeechRecognition wrapper. Uses the browser-native Web Speech API
 * (Chrome, Edge, Safari iOS 14+). No API keys, no network calls outside
 * the browser. Streams interim transcripts so the user sees text appear
 * while they speak.
 *
 * Note: types for SpeechRecognition aren't in lib.dom for all TS configs,
 * so we declare a minimal interface and use `unknown` casts at the
 * window-property level.
 */

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type RecognitionStatus = "idle" | "listening" | "denied" | "unsupported";

interface UseSpeechRecognitionOptions {
  lang?: string;
  /** Called for each interim/final transcript chunk. */
  onTranscript?: (text: string, isFinal: boolean) => void;
  /** Called when the engine stops (final). */
  onStopped?: () => void;
  /** Called on a permission or runtime error. */
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  status: RecognitionStatus;
  isListening: boolean;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { lang = "ar-SA", onTranscript, onStopped, onError } = options;

  const [status, setStatus] = React.useState<RecognitionStatus>(() =>
    getSpeechRecognitionCtor() ? "idle" : "unsupported"
  );
  const recRef = React.useRef<SpeechRecognitionLike | null>(null);
  // Latest callbacks in refs so we don't tear down the recognizer on rerender.
  const onTranscriptRef = React.useRef(onTranscript);
  const onStoppedRef = React.useRef(onStopped);
  const onErrorRef = React.useRef(onError);
  React.useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);
  React.useEffect(() => {
    onStoppedRef.current = onStopped;
  }, [onStopped]);
  React.useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const start = React.useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    if (recRef.current) {
      try {
        recRef.current.abort();
      } catch {
        // ignore
      }
      recRef.current = null;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.onstart = () => setStatus("listening");
    rec.onresult = (e: SpeechRecognitionEvent) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0]?.transcript ?? "";
        if (!text) continue;
        onTranscriptRef.current?.(text, result.isFinal);
      }
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setStatus("denied");
      }
      onErrorRef.current?.(e.error);
    };
    rec.onend = () => {
      setStatus((prev) => (prev === "denied" ? "denied" : "idle"));
      onStoppedRef.current?.();
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      // start() throws if called twice quickly; treat as benign.
      onErrorRef.current?.(String(err));
    }
  }, [lang]);

  const stop = React.useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      // ignore
    }
  }, []);

  const toggle = React.useCallback(() => {
    if (status === "listening") {
      stop();
    } else if (status === "idle") {
      start();
    }
  }, [status, start, stop]);

  React.useEffect(() => {
    return () => {
      const rec = recRef.current;
      if (rec) {
        try {
          rec.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    status,
    isListening: status === "listening",
    isSupported: status !== "unsupported",
    start,
    stop,
    toggle,
  };
}
