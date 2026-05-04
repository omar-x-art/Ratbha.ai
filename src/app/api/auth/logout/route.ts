import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/google/session";
import { getUserByEmail } from "@/lib/supabase/users";
import { auditLog } from "@/lib/supabase/audit";

export async function POST() {
  const session = await getSession();
  if (session) {
    try {
      const user = await getUserByEmail(session.email);
      if (user) {
        await auditLog({
          userId: user.id,
          action: "google_logout",
        });
      }
    } catch {
      // ignore
    }
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}
