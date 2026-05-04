import { NextResponse } from "next/server";
import { z } from "zod";
import { extractTasks } from "@/lib/gemini/provider";

const RequestSchema = z.object({
  text: z.string().min(1).max(4000),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const out = await extractTasks(parsed.data);
  return NextResponse.json(out);
}
