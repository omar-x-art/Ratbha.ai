import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/google/session";
import { insertEvent } from "@/lib/google/calendar";

const SaveSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      start_time: z.string(),
      end_time: z.string(),
      reason: z.string().optional(),
    })
  ),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const session = await getSession();
  if (!session) {
    // Demo / not-connected: simulate success.
    return NextResponse.json({
      connected: false,
      saved: parsed.data.items.map((it) => ({
        ...it,
        google_event_id: `mock_${it.id}`,
      })),
    });
  }

  const saved: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    google_event_id: string;
  }> = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const it of parsed.data.items) {
    try {
      const created = await insertEvent(session.access_token, {
        summary: it.title,
        description: it.reason,
        start: it.start_time,
        end: it.end_time,
        reminders: true,
      });
      saved.push({
        id: it.id,
        title: it.title,
        start_time: it.start_time,
        end_time: it.end_time,
        google_event_id: created.id,
      });
    } catch (err) {
      failed.push({ id: it.id, error: String(err).slice(0, 200) });
    }
  }

  return NextResponse.json({
    connected: true,
    saved,
    failed,
  });
}
