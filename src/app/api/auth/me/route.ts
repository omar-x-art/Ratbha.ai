import { NextResponse } from "next/server";
import { getSession } from "@/lib/google/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ connected: false });
  }
  return NextResponse.json({
    connected: true,
    email: session.email,
    name: session.name,
    picture: session.picture,
    expires_at: session.expires_at,
  });
}
