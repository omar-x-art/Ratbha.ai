import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForTokens,
  encodeSessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/google/oauth";
import { upsertGoogleUser } from "@/lib/supabase/users";
import { auditLog } from "@/lib/supabase/audit";

const STATE_COOKIE = "rattabha-oauth-state";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  const origin = url.origin;
  const errorRedirect = (reason: string) =>
    NextResponse.redirect(
      `${origin}/connect-calendar?error=${encodeURIComponent(reason)}`
    );

  if (err) return errorRedirect(err);
  if (!code || !state) return errorRedirect("missing_code_or_state");

  const jar = cookies();
  const expectedState = jar.get(STATE_COOKIE)?.value;
  if (!expectedState || expectedState !== state) {
    return errorRedirect("invalid_state");
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch {
    return errorRedirect("token_exchange_failed");
  }

  // Best-effort sync to Supabase. Failures here must NOT block login.
  try {
    const user = await upsertGoogleUser({
      email: tokens.email,
      name: tokens.name,
    });
    if (user) {
      await auditLog({
        userId: user.id,
        action: "google_login",
        metadata: { email: tokens.email },
      });
    }
  } catch {
    // Swallow — Supabase is optional in Phase 5.
  }

  const cookieValue = await encodeSessionCookie(tokens);
  const res = NextResponse.redirect(`${origin}/?connected=1`);
  res.cookies.set(SESSION_COOKIE_NAME, cookieValue, SESSION_COOKIE_OPTIONS);
  res.cookies.set(STATE_COOKIE, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
  return res;
}
