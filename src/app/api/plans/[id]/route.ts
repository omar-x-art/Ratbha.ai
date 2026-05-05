import { NextResponse } from "next/server";
import { getSession } from "@/lib/google/session";
import { getUserByEmail } from "@/lib/supabase/users";
import { getPlanWithItems } from "@/lib/supabase/plans-list";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ connected: false, plan: null, items: [] });
  }
  try {
    const user = await getUserByEmail(session.email);
    if (!user) {
      return NextResponse.json({ connected: true, plan: null, items: [] });
    }
    const result = await getPlanWithItems(user.id, ctx.params.id);
    return NextResponse.json({ connected: true, ...result });
  } catch (err) {
    return NextResponse.json(
      {
        connected: true,
        plan: null,
        items: [],
        error: String(err).slice(0, 200),
      },
      { status: 200 }
    );
  }
}
