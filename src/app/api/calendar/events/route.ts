import { NextResponse } from "next/server";
import { getSession } from "@/lib/google/session";
import { listEvents } from "@/lib/google/calendar";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  // Window: now → +7 days
  const now = new Date();
  const url = new URL(req.url);
  const days = Math.min(
    Math.max(parseInt(url.searchParams.get("days") ?? "7", 10), 1),
    30
  );
  const end = new Date(now.getTime() + days * 24 * 3600 * 1000);

  if (!session) {
    // Not connected — return mock for demo flows.
    return NextResponse.json({
      connected: false,
      events: [
        {
          id: "ev-1",
          title: "اجتماع",
          start: dayAt(now, 14).toISOString(),
          end: dayAt(now, 15).toISOString(),
          isMeeting: true,
        },
      ],
    });
  }

  try {
    const items = await listEvents(
      session.access_token,
      now.toISOString(),
      end.toISOString()
    );
    const events = items
      .filter((e) => e.status !== "cancelled")
      .map((e) => ({
        id: e.id,
        title: e.summary ?? "(بدون عنوان)",
        start: e.start?.dateTime ?? e.start?.date,
        end: e.end?.dateTime ?? e.end?.date,
        isMeeting: (e.attendees?.length ?? 0) > 1,
      }))
      .filter((e) => e.start && e.end);
    return NextResponse.json({ connected: true, events });
  } catch (err) {
    return NextResponse.json(
      { connected: true, events: [], error: String(err).slice(0, 200) },
      { status: 200 }
    );
  }
}

function dayAt(d: Date, hour: number): Date {
  const x = new Date(d);
  x.setHours(hour, 0, 0, 0);
  return x;
}
