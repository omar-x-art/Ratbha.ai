import { NextRequest, NextResponse } from "next/server";
import { isGoogleOAuthConfigured, revokeGoogleToken } from "@/lib/google/oauth";
import {
  GOOGLE_ACCOUNTS_COOKIE,
  clearCalendarAccountsCookie,
  parseCalendarAccountsCookie,
  toPublicGoogleAccounts,
  writeCalendarAccountsCookie,
} from "@/lib/google/calendar-session";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const accounts = parseCalendarAccountsCookie(
    request.cookies.get(GOOGLE_ACCOUNTS_COOKIE)?.value
  );

  return NextResponse.json({
    configured: isGoogleOAuthConfigured(),
    accounts: toPublicGoogleAccounts(accounts),
  });
}

export async function DELETE(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("accountId");
  const accounts = parseCalendarAccountsCookie(
    request.cookies.get(GOOGLE_ACCOUNTS_COOKIE)?.value
  );
  const removedAccounts = accountId
    ? accounts.filter((account) => account.id === accountId)
    : accounts;
  const remainingAccounts = accountId
    ? accounts.filter((account) => account.id !== accountId)
    : [];

  await Promise.allSettled(
    removedAccounts.map((account) => revokeGoogleToken(account.refreshToken))
  );

  const response = NextResponse.json({
    configured: isGoogleOAuthConfigured(),
    accounts: toPublicGoogleAccounts(remainingAccounts),
  });

  if (remainingAccounts.length === 0) {
    clearCalendarAccountsCookie(response);
  } else {
    writeCalendarAccountsCookie(response, remainingAccounts);
  }

  return response;
}
