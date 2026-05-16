import { TaskExtractionSchema, type TaskExtraction } from "@/lib/gemini/schema";

interface GeminiTextPart {
  text?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiTextPart[];
    };
  }>;
}

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export async function extractTasksWithGemini({
  text,
  timezone,
}: {
  text: string;
  timezone: string;
}): Promise<TaskExtraction | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildPrompt(text, timezone) }],
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as GeminiResponse;
  const output = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!output) return null;

  try {
    return TaskExtractionSchema.parse(JSON.parse(extractJson(output)));
  } catch {
    return null;
  }
}

function buildPrompt(text: string, timezone: string) {
  return [
    "استخرج المهام من النص العربي التالي بصيغة JSON فقط.",
    "لا تضف markdown ولا شرح.",
    `المنطقة الزمنية: ${timezone}`,
    "الشكل المطلوب: { language, timezone, tasks, fixed_events_mentioned, ambiguities }",
    "كل مهمة تحتوي: title, date_expression, time_expression, duration_minutes, priority, energy, flexibility, confidence.",
    "القيم المسموحة: priority low/medium/high/urgent، energy low/medium/high، flexibility fixed/flexible/deadline.",
    `النص: ${text}`,
  ].join("\n");
}

function extractJson(output: string) {
  const fenced = output.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start >= 0 && end > start) return output.slice(start, end + 1);
  return output;
}
