import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { extractTasksWithGemini } from "@/lib/gemini/client";
import { fetchCalendarEvents } from "@/lib/google/calendar";
import {
  GOOGLE_ACCOUNTS_COOKIE,
  parseCalendarAccountsCookie,
} from "@/lib/google/calendar-session";
import { buildPlanFromExtraction, buildPlanFromText } from "@/lib/plan/build-plan";

export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  text: z.string().min(1).max(4000),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

export async function POST(req: NextRequest) {
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

  const timezone = parsed.data.timezone ?? "Africa/Cairo";
  const [geminiExtraction, calendarEvents] = await Promise.all([
    extractTasksWithGemini({
      text: parsed.data.text,
      timezone,
    }),
    loadCalendarEvents(req),
  ]);
  const result = geminiExtraction
    ? buildPlanFromExtraction(parsed.data.text, geminiExtraction, {
        timezone,
        calendarEvents,
      })
    : buildPlanFromText(parsed.data.text, {
        timezone,
        calendarEvents,
      });

  return NextResponse.json({
    ...(geminiExtraction ?? result.extraction),
    plan: {
      ...result.plan,
      input_text: parsed.data.text,
      ai_model: geminiExtraction ? "gemini-2.5-flash" : "local",
    },
  });
}

async function loadCalendarEvents(req: NextRequest) {
  try {
    const accounts = parseCalendarAccountsCookie(
      req.cookies.get(GOOGLE_ACCOUNTS_COOKIE)?.value
    );
    const timeMin = new Date();
    const timeMax = new Date(timeMin);
    timeMax.setDate(timeMin.getDate() + 14);
    const result = await fetchCalendarEvents({ timeMin, timeMax, accounts });
    return result.events;
  } catch {
    return [];
  }
}
