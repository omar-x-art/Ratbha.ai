import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { NextResponse } from "next/server";

export interface GoogleCalendarAccount {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  refreshToken: string;
  scope?: string;
  connectedAt: string;
}

export interface PublicGoogleCalendarAccount {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  connectedAt: string;
}

export const GOOGLE_ACCOUNTS_COOKIE = "ratbha_google_calendar_accounts";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 60;
const ENCRYPTION_VERSION = "v1";

function getSessionSecret() {
  return process.env.GOOGLE_OAUTH_COOKIE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "";
}

function getEncryptionKey() {
  const secret = getSessionSecret();
  if (!secret) throw new Error("missing_google_cookie_secret");
  return createHash("sha256").update(secret).digest();
}

function toBase64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(`${normalized}${padding}`, "base64");
}

function normalizeAccounts(accounts: GoogleCalendarAccount[]) {
  const map = new Map<string, GoogleCalendarAccount>();
  accounts.forEach((account) => {
    map.set(account.id, {
      id: account.id,
      email: account.email,
      name: account.name,
      picture: account.picture,
      refreshToken: account.refreshToken,
      scope: account.scope,
      connectedAt: account.connectedAt,
    });
  });
  return Array.from(map.values()).sort((a, b) => a.email.localeCompare(b.email));
}

export function serializeCalendarAccounts(accounts: GoogleCalendarAccount[]) {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(normalizeAccounts(accounts)), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTION_VERSION,
    toBase64Url(iv),
    toBase64Url(tag),
    toBase64Url(encrypted),
  ].join(".");
}

export function parseCalendarAccountsCookie(value?: string): GoogleCalendarAccount[] {
  if (!value) return [];

  try {
    const [version, ivValue, tagValue, encryptedValue] = value.split(".");
    if (version !== ENCRYPTION_VERSION || !ivValue || !tagValue || !encryptedValue) {
      return [];
    }

    const key = getEncryptionKey();
    const decipher = createDecipheriv("aes-256-gcm", key, fromBase64Url(ivValue));
    decipher.setAuthTag(fromBase64Url(tagValue));
    const decrypted = Buffer.concat([
      decipher.update(fromBase64Url(encryptedValue)),
      decipher.final(),
    ]);
    const parsed = JSON.parse(decrypted.toString("utf8")) as GoogleCalendarAccount[];
    if (!Array.isArray(parsed)) return [];

    return normalizeAccounts(
      parsed.filter(
        (account) =>
          typeof account.id === "string" &&
          typeof account.email === "string" &&
          typeof account.refreshToken === "string" &&
          typeof account.connectedAt === "string"
      )
    );
  } catch {
    return [];
  }
}

export function toPublicGoogleAccount(
  account: GoogleCalendarAccount
): PublicGoogleCalendarAccount {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    picture: account.picture,
    connectedAt: account.connectedAt,
  };
}

export function toPublicGoogleAccounts(accounts: GoogleCalendarAccount[]) {
  return normalizeAccounts(accounts).map(toPublicGoogleAccount);
}

export function upsertCalendarAccount(
  accounts: GoogleCalendarAccount[],
  account: GoogleCalendarAccount
) {
  return normalizeAccounts([
    ...accounts.filter((item) => item.id !== account.id),
    account,
  ]);
}

export function writeCalendarAccountsCookie(
  response: NextResponse,
  accounts: GoogleCalendarAccount[]
) {
  response.cookies.set(GOOGLE_ACCOUNTS_COOKIE, serializeCalendarAccounts(accounts), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearCalendarAccountsCookie(response: NextResponse) {
  response.cookies.set(GOOGLE_ACCOUNTS_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
