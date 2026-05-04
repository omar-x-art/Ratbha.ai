import { NextResponse } from "next/server";
import { z } from "zod";

const SaveSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      start_time: z.string(),
      end_time: z.string(),
    })
  ),
});

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

  // MVP stub: pretend each item was saved with a fake google_event_id.
  return NextResponse.json({
    saved: parsed.data.items.map((it) => ({
      ...it,
      google_event_id: `gcal_mock_${it.id}_${Date.now()}`,
    })),
  });
}
