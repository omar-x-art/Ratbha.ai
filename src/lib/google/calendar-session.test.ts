import { describe, expect, it, vi } from "vitest";
import {
  parseCalendarAccountsCookie,
  serializeCalendarAccounts,
  upsertCalendarAccount,
} from "@/lib/google/calendar-session";
import type { GoogleCalendarAccount } from "@/lib/google/calendar-session";

const ACCOUNT_A: GoogleCalendarAccount = {
  id: "a",
  email: "omar@example.com",
  name: "Omar",
  refreshToken: "refresh-a",
  connectedAt: "2026-05-17T10:00:00.000Z",
};

const ACCOUNT_B: GoogleCalendarAccount = {
  id: "b",
  email: "team@example.com",
  refreshToken: "refresh-b",
  connectedAt: "2026-05-17T11:00:00.000Z",
};

describe("calendar session", () => {
  it("encrypts and reads multiple Google accounts", () => {
    vi.stubEnv("GOOGLE_OAUTH_COOKIE_SECRET", "test-secret");

    const cookie = serializeCalendarAccounts([ACCOUNT_A, ACCOUNT_B]);
    const parsed = parseCalendarAccountsCookie(cookie);

    expect(parsed).toHaveLength(2);
    expect(parsed.map((account) => account.email)).toEqual([
      "omar@example.com",
      "team@example.com",
    ]);
    expect(cookie).not.toContain("refresh-a");
  });

  it("replaces the same account without duplicating it", () => {
    const accounts = upsertCalendarAccount([ACCOUNT_A], {
      ...ACCOUNT_A,
      refreshToken: "refresh-new",
    });

    expect(accounts).toHaveLength(1);
    expect(accounts[0].refreshToken).toBe("refresh-new");
  });

  it("returns an empty list for invalid cookies", () => {
    vi.stubEnv("GOOGLE_OAUTH_COOKIE_SECRET", "test-secret");

    expect(parseCalendarAccountsCookie("broken")).toEqual([]);
  });
});
