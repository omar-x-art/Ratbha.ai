/**
 * User management against Supabase. Phase 5.
 *
 * We don't use Supabase Auth (yet); instead we treat `email` as the natural
 * unique key. Idempotent upsert on Google OAuth callback.
 */
import { getSupabaseAdmin, isSupabaseConfigured } from "./admin";

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  timezone: string;
}

export async function upsertGoogleUser(args: {
  email: string;
  name?: string;
}): Promise<UserRecord | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("users")
    .upsert(
      {
        email: args.email,
        name: args.name ?? null,
      },
      { onConflict: "email" }
    )
    .select("id, email, name, timezone")
    .single();
  if (error || !data) return null;
  return data as UserRecord;
}

export async function getUserByEmail(
  email: string
): Promise<UserRecord | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("users")
    .select("id, email, name, timezone")
    .eq("email", email)
    .maybeSingle();
  return (data as UserRecord) ?? null;
}
