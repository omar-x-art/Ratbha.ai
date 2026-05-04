import { describe, it, expect, beforeEach } from "vitest";
import {
  buildAuthorizeUrl,
  encodeSessionCookie,
  decodeSessionCookie,
  GOOGLE_AUTH_URL,
  type GoogleTokens,
} from "./oauth";

beforeEach(() => {
  process.env.GOOGLE_CLIENT_ID = "test-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "test-secret";
  process.env.GOOGLE_REDIRECT_URI = "http://localhost:3000/cb";
  process.env.SESSION_SECRET = "x".repeat(32);
});

describe("buildAuthorizeUrl", () => {
  it("emits a Google authorize URL with client_id, redirect, state, and Calendar scope", () => {
    const url = new URL(buildAuthorizeUrl("abc"));
    expect(url.toString()).toContain(GOOGLE_AUTH_URL);
    expect(url.searchParams.get("client_id")).toBe("test-client-id");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/cb");
    expect(url.searchParams.get("state")).toBe("abc");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("scope")).toContain(
      "https://www.googleapis.com/auth/calendar"
    );
  });
});

describe("session cookie roundtrip", () => {
  it("encodes and decodes back to the same tokens", async () => {
    const tokens: GoogleTokens = {
      access_token: "at",
      refresh_token: "rt",
      expires_at: Date.now() + 60_000,
      scope: "https://www.googleapis.com/auth/calendar",
      email: "u@example.com",
      name: "User",
    };
    const jwt = await encodeSessionCookie(tokens);
    const back = await decodeSessionCookie(jwt);
    expect(back).toEqual(tokens);
  });

  it("returns null for tampered or invalid cookies", async () => {
    const back = await decodeSessionCookie("not-a-jwt");
    expect(back).toBeNull();
  });
});
