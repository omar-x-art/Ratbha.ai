import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForTokens,
  encodeSessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/google/oauth";

const STATE_COOKIE = "rattabha-oauth-state";

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

  const cookieValue = await encodeSessionCookie(tokens);
  const res = NextResponse.redirect(`${origin}/?connected=1`);
  res.cookies.set(SESSION_COOKIE_NAME, cookieValue, SESSION_COOKIE_OPTIONS);
  res.cookies.set(STATE_COOKIE, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
  return res;
}
