import { NextRequest, NextResponse } from "next/server";
import {
  exchangeAuthorizationCode,
  fetchGoogleUserInfo,
  getGoogleOAuthConfig,
} from "@/lib/google/oauth";
import {
  GOOGLE_ACCOUNTS_COOKIE,
  parseCalendarAccountsCookie,
  upsertCalendarAccount,
  writeCalendarAccountsCookie,
} from "@/lib/google/calendar-session";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "ratbha_google_oauth_state";
const RETURN_COOKIE = "ratbha_google_oauth_return";

export async function GET(request: NextRequest) {
  const returnTo = normalizeReturnTo(request.cookies.get(RETURN_COOKIE)?.value);
  const redirectUrl = new URL(returnTo, request.url);
  const config = getGoogleOAuthConfig(request);

  if (!config) return redirectWithStatus(redirectUrl, "missing_google_config");

  const error = request.nextUrl.searchParams.get("error");
  if (error) return redirectWithStatus(redirectUrl, error);

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithStatus(redirectUrl, "invalid_google_state");
  }

  try {
    const currentAccounts = parseCalendarAccountsCookie(
      request.cookies.get(GOOGLE_ACCOUNTS_COOKIE)?.value
    );
    const token = await exchangeAuthorizationCode({ code, config });
    const user = await fetchGoogleUserInfo(token.accessToken);
    const existing = currentAccounts.find((account) => account.id === user.id);
    const refreshToken = token.refreshToken ?? existing?.refreshToken;

    if (!refreshToken) {
      return redirectWithStatus(redirectUrl, "missing_refresh_token");
    }

    const accounts = upsertCalendarAccount(currentAccounts, {
      id: user.id,
      email: user.email.toLowerCase(),
      name: user.name,
      picture: user.picture,
      refreshToken,
      scope: token.scope,
      connectedAt: existing?.connectedAt ?? new Date().toISOString(),
    });

    const response = redirectWithStatus(redirectUrl, "connected");
    writeCalendarAccountsCookie(response, accounts);
    clearTemporaryCookies(response);
    return response;
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "google_connect_failed";
    const response = redirectWithStatus(redirectUrl, message);
    clearTemporaryCookies(response);
    return response;
  }
}

function redirectWithStatus(url: URL, status: string) {
  url.searchParams.set("calendar", status);
  return NextResponse.redirect(url);
}

function clearTemporaryCookies(response: NextResponse) {
  [STATE_COOKIE, RETURN_COOKIE].forEach((name) => {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  });
}

function normalizeReturnTo(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/connect-calendar";
  }
  return value;
}
