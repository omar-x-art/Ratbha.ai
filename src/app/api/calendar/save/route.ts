import { NextResponse } from "next/server";
import { z } from "zod";
import { saveCalendarEvents } from "@/lib/google/calendar";

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

  const result = await saveCalendarEvents(parsed.data.items);

  return NextResponse.json(result);
}
