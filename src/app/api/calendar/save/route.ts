import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveCalendarEvents } from "@/lib/google/calendar";
import { shouldShowTaskInCalendar } from "@/lib/calendar/upcoming";
import {
  GOOGLE_ACCOUNTS_COOKIE,
  parseCalendarAccountsCookie,
} from "@/lib/google/calendar-session";

export const dynamic = "force-dynamic";

const SaveSchema = z.object({
  accountId: z.string().optional(),
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      start_time: z.string(),
      end_time: z.string(),
      show_in_calendar: z.boolean().optional(),
    })
  ),
});

export async function POST(req: NextRequest) {
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

  const accounts = parseCalendarAccountsCookie(
    req.cookies.get(GOOGLE_ACCOUNTS_COOKIE)?.value
  );
  const result = await saveCalendarEvents(
    parsed.data.items.filter(shouldShowTaskInCalendar),
    {
      accounts,
      accountId: parsed.data.accountId,
    }
  );

  return NextResponse.json(result);
}
