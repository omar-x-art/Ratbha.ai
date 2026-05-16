import { NextResponse } from "next/server";
import { z } from "zod";
import { extractTasksWithGemini } from "@/lib/gemini/client";
import { buildPlanFromText } from "@/lib/plan/build-plan";
import type { TaskExtraction } from "@/lib/gemini/schema";

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

  const timezone = parsed.data.timezone ?? "Africa/Cairo";
  const geminiExtraction = await extractTasksWithGemini({
    text: parsed.data.text,
    timezone,
  });
  const planningText = geminiExtraction
    ? renderExtractionAsText(geminiExtraction)
    : parsed.data.text;
  const result = buildPlanFromText(planningText, {
    timezone: parsed.data.timezone,
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

function renderExtractionAsText(extraction: TaskExtraction) {
  const fixedEvents = extraction.fixed_events_mentioned.map((event) =>
    [
      "عندي",
      event.title,
      event.date_expression,
      event.time_expression,
      `${event.duration_minutes} دقيقة`,
    ]
      .filter(Boolean)
      .join(" ")
  );
  const tasks = extraction.tasks.map((task) =>
    [
      task.title,
      task.date_expression,
      task.time_expression,
      `${task.duration_minutes} دقيقة`,
    ]
      .filter(Boolean)
      .join(" ")
  );
  const ambiguities = extraction.ambiguities.map((item) => item.text);

  return [...fixedEvents, ...tasks, ...ambiguities].join("، ");
}
