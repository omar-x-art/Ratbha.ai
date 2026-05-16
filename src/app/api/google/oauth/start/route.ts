import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleAuthorizationUrl,
  getGoogleOAuthConfig,
} from "@/lib/google/oauth";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "ratbha_google_oauth_state";
const RETURN_COOKIE = "ratbha_google_oauth_return";

export function GET(request: NextRequest) {
  const config = getGoogleOAuthConfig(request);
  const returnTo = normalizeReturnTo(request.nextUrl.searchParams.get("returnTo"));

  if (!config) {
    return NextResponse.redirect(
      new URL(`${returnTo}?calendar=missing_google_config`, request.url)
    );
  }

  const state = randomBytes(24).toString("hex");
  const response = NextResponse.redirect(
    buildGoogleAuthorizationUrl({ config, state })
  );

  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  response.cookies.set(RETURN_COOKIE, returnTo, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}

function normalizeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/connect-calendar";
  }
  return value;
}
