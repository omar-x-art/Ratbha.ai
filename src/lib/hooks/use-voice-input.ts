"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SRResult {
  isFinal: boolean;
  0: { transcript: string };
  length: number;
  [index: number]: { transcript: string };
}

interface SREvent {
  results: {
    length: number;
    [index: number]: SRResult;
  };
  resultIndex: number;
}

interface SRError {
  error: string;
  message?: string;
}

interface SRInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRError) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface UseVoiceInputOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

function getSpeechRecognition(): (new () => SRInstance) | null {
  if (typeof window === "undefined") return null;

  const w = window as unknown as Record<string, unknown>;
  if (typeof w.SpeechRecognition === "function") {
    return w.SpeechRecognition as new () => SRInstance;
  }
  if (typeof w.webkitSpeechRecognition === "function") {
    return w.webkitSpeechRecognition as new () => SRInstance;
  }
  return null;
}

function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    lang = "ar-SA",
    continuous = true,
    interimResults = true,
    maxAlternatives = 1,
    onResult,
    onEnd,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SRInstance | null>(null);
  const isStoppedRef = useRef(false);

  const isSupported =
    typeof window !== "undefined" && getSpeechRecognition() !== null;

  const createRecognition = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return null;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;

    recognition.onresult = (event: SREvent) => {
      let finalTranscript = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
        setInterimTranscript("");
        onResult?.(finalTranscript, true);
      }

      if (interim) {
        setInterimTranscript(interim);
        onResult?.(interim, false);
      }
    };

    recognition.onerror = (event: SRError) => {
      setError(event.error);
      setIsListening(false);
      onError?.(event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      onEnd?.();
    };

    return recognition;
  }, [lang, continuous, interimResults, maxAlternatives, onResult, onEnd, onError]);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    setError(null);
    isStoppedRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* noop */
      }
    }

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setError("فشل بدء التعرف على الصوت");
    }
  }, [isSupported, createRecognition]);

  const stopListening = useCallback(() => {
    isStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* noop */
      }
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* noop */
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}

export { useVoiceInput };
export type { UseVoiceInputReturn };
