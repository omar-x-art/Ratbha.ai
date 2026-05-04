/**
 * Google OAuth — direct integration (no Supabase Auth dependency).
 *
 * Flow:
 *  1. /api/auth/google/start  → redirect to Google with state + PKCE.
 *  2. Google → /api/auth/google/callback?code=...
 *  3. Server exchanges code for tokens, encrypts them as a JWT, sets
 *     an httpOnly cookie. The cookie is the source of truth for the
 *     user's Calendar access.
 */

import { SignJWT, jwtVerify } from "jose";

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_URL =
  "https://www.googleapis.com/oauth2/v3/userinfo";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // epoch ms
  scope: string;
  email: string;
  name?: string;
  picture?: string;
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing_env:${name}`);
  return v;
}

export function getRedirectUri(): string {
  return (
    process.env.GOOGLE_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/google/callback`
  );
}

export function buildAuthorizeUrl(state: string): string {
  const u = new URL(GOOGLE_AUTH_URL);
  u.searchParams.set("client_id", env("GOOGLE_CLIENT_ID"));
  u.searchParams.set("redirect_uri", getRedirectUri());
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", GOOGLE_SCOPES);
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "consent");
  u.searchParams.set("state", state);
  u.searchParams.set("include_granted_scopes", "true");
  return u.toString();
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const body = new URLSearchParams({
    code,
    client_id: env("GOOGLE_CLIENT_ID"),
    client_secret: env("GOOGLE_CLIENT_SECRET"),
    redirect_uri: getRedirectUri(),
    grant_type: "authorization_code",
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`google_token_exchange_failed:${res.status}`);
  }
  const data = (await res.json()) as GoogleTokenResponse;
  const userInfo = await fetchUserInfo(data.access_token);
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    scope: data.scope,
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.picture,
  };
}

interface GoogleUserInfo {
  email: string;
  name?: string;
  picture?: string;
}

async function fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("google_userinfo_failed");
  return (await res.json()) as GoogleUserInfo;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expires_at: number }> {
  const body = new URLSearchParams({
    client_id: env("GOOGLE_CLIENT_ID"),
    client_secret: env("GOOGLE_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`google_token_refresh_failed:${res.status}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

const COOKIE_NAME = "rattabha-auth";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecretKey(): Uint8Array {
  const s = env("SESSION_SECRET");
  return new TextEncoder().encode(s);
}

export async function encodeSessionCookie(tokens: GoogleTokens): Promise<string> {
  return await new SignJWT({ tokens })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function decodeSessionCookie(jwt: string): Promise<GoogleTokens | null> {
  try {
    const { payload } = await jwtVerify(jwt, getSecretKey());
    const t = (payload as { tokens?: GoogleTokens }).tokens;
    return t ?? null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
