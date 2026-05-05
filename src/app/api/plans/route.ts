import { NextResponse } from "next/server";
import { getSession } from "@/lib/google/session";
import { getUserByEmail } from "@/lib/supabase/users";
import { listPlansForUser } from "@/lib/supabase/plans-list";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ connected: false, plans: [] });
  }
  try {
    const user = await getUserByEmail(session.email);
    if (!user) {
      return NextResponse.json({ connected: true, plans: [] });
    }
    const plans = await listPlansForUser(user.id);
    return NextResponse.json({ connected: true, plans });
  } catch (err) {
    return NextResponse.json(
      { connected: true, plans: [], error: String(err).slice(0, 200) },
      { status: 200 }
    );
  }
}
