import { NextResponse } from "next/server";
import { fetchCalendarEvents } from "@/lib/google/calendar";

export async function GET() {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + 7);
  const result = await fetchCalendarEvents({ timeMin: now, timeMax: end });

  return NextResponse.json(result);
}
