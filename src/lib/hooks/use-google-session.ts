"use client";

import { useEffect, useState } from "react";

export interface SessionInfo {
  connected: boolean;
  email?: string;
  name?: string;
  picture?: string;
}

export function useGoogleSession(): SessionInfo | null {
  const [info, setInfo] = useState<SessionInfo | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json() as Promise<SessionInfo>)
      .then((data) => {
        if (!cancelled) setInfo(data);
      })
      .catch(() => {
        if (!cancelled) setInfo({ connected: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return info;
}
