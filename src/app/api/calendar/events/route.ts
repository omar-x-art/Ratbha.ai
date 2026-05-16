import { NextRequest, NextResponse } from "next/server";
import { fetchCalendarEvents } from "@/lib/google/calendar";
import {
  GOOGLE_ACCOUNTS_COOKIE,
  parseCalendarAccountsCookie,
} from "@/lib/google/calendar-session";
import { isGoogleOAuthConfigured } from "@/lib/google/oauth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const timeMinParam = request.nextUrl.searchParams.get("timeMin");
  const timeMaxParam = request.nextUrl.searchParams.get("timeMax");
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + 7);

  const timeMin = parseDateParam(timeMinParam) ?? now;
  const timeMax = parseDateParam(timeMaxParam) ?? end;
  const accounts = parseCalendarAccountsCookie(
    request.cookies.get(GOOGLE_ACCOUNTS_COOKIE)?.value
  );
  const result = await fetchCalendarEvents({ timeMin, timeMax, accounts });

  return NextResponse.json({
    ...result,
    configured: isGoogleOAuthConfigured(),
  });
}

function parseDateParam(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
