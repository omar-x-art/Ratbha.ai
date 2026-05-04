import { NextResponse } from "next/server";
import { z } from "zod";
import { TaskExtractionSchema } from "@/lib/gemini/schema";

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

  // MVP stub: deterministic mock that matches the example in the plan §7.
  const mock = TaskExtractionSchema.parse({
    language: "ar",
    timezone: parsed.data.timezone ?? "Asia/Riyadh",
    tasks: [
      {
        title: "إنهاء العرض التقديمي",
        date_expression: "بكرة",
        duration_minutes: 90,
        priority: "high",
        energy: "high",
        flexibility: "deadline",
        type: "deep_work",
        confidence: 0.86,
      },
      {
        title: "الجيم",
        date_expression: "اليوم",
        time_expression: "بعد الشغل",
        duration_minutes: 60,
        priority: "medium",
        energy: "medium",
        flexibility: "flexible",
        confidence: 0.74,
      },
      {
        title: "مكالمة العميل",
        date_expression: "الخميس",
        duration_minutes: 30,
        priority: "high",
        energy: "low",
        flexibility: "fixed",
        confidence: 0.9,
      },
    ],
    fixed_events_mentioned: [
      {
        title: "اجتماع",
        date_expression: "اليوم",
        time_expression: "2",
        duration_minutes: 60,
        confidence: 0.82,
      },
    ],
    ambiguities: [
      {
        text: "بعد الشغل",
        question: "ما وقت انتهاء العمل الافتراضي؟",
        fallback: "18:00",
      },
    ],
  });

  return NextResponse.json(mock);
}
