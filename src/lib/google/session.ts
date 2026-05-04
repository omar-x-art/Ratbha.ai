/**
 * Session helpers for server routes/components.
 * Reads the auth cookie, refreshes Google tokens if expired,
 * and rewrites the cookie when refreshed.
 */

import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  decodeSessionCookie,
  encodeSessionCookie,
  refreshAccessToken,
  type GoogleTokens,
} from "@/lib/google/oauth";

const REFRESH_THRESHOLD_MS = 60_000; // refresh 1 min before expiry

export async function getSession(): Promise<GoogleTokens | null> {
  const jar = cookies();
  const c = jar.get(SESSION_COOKIE_NAME);
  if (!c) return null;
  const tokens = await decodeSessionCookie(c.value);
  if (!tokens) return null;
  if (
    tokens.expires_at - Date.now() < REFRESH_THRESHOLD_MS &&
    tokens.refresh_token
  ) {
    try {
      const next = await refreshAccessToken(tokens.refresh_token);
      const merged: GoogleTokens = { ...tokens, ...next };
      const cookie = await encodeSessionCookie(merged);
      jar.set(SESSION_COOKIE_NAME, cookie, SESSION_COOKIE_OPTIONS);
      return merged;
    } catch {
      return null;
    }
  }
  return tokens;
}

export async function clearSession(): Promise<void> {
  const jar = cookies();
  jar.set(SESSION_COOKIE_NAME, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
}
