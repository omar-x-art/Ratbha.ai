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
  const today = new Date().toISOString().slice(0, 10);

  return [
    "أنت سراج، مساعد تخطيط يومي عربي. حوّل الكلام الحر إلى مهام فعلية منظمة بصيغة JSON فقط.",
    "لا تنسخ جمل المستخدم كما هي. اكتب عنواناً قصيراً ومهنياً لكل مهمة بصيغة اسمية مثل: مراجعة التقرير، اتصال مع أحمد، تمرين في الجيم.",
    "احذف الحشو مثل: أنا عندي، النهاردة، عايز، لازم، ممكن، إن شاء الله، واستخدمها فقط لفهم التاريخ أو النية.",
    "لو قال المستخدم اليوم أو النهاردة فاجعل date_expression اليوم. لو قال بكرة أو بكره أو بكرا فاجعلها بكرة. لو قال بعد بكرة فاجعلها بعد بكرة.",
    "لو ذكر وقتاً صريحاً فاكتبه في time_expression واجعل flexibility fixed. لو لم يذكر وقتاً فاترك time_expression null واجعل flexibility flexible أو deadline حسب الكلام.",
    "لو ذكر مدة فاكتبها بالدقائق. إن لم يذكر مدة فاختر مدة معقولة حسب نوع المهمة.",
    "استخدم resolved_date_hint بصيغة YYYY-MM-DD عندما تستطيع حساب التاريخ من اليوم.",
    "ضع الاجتماعات أو المواعيد الموجودة فعلاً في fixed_events_mentioned، أما الأشياء المطلوب إنجازها فضعها في tasks.",
    "لو الكلام مبهم ولا يمكن تحويله لمهمة، ضعه في ambiguities مع سؤال عربي قصير.",
    "لا تضف markdown ولا شرح ولا أي نص خارج JSON.",
    `المنطقة الزمنية: ${timezone}`,
    `تاريخ اليوم: ${today}`,
    "الشكل المطلوب: { language, timezone, tasks, fixed_events_mentioned, ambiguities }",
    "كل مهمة تحتوي: title, date_expression, resolved_date_hint, time_expression, duration_minutes, priority, energy, flexibility, confidence.",
    "كل موعد ثابت يحتوي: title, date_expression, resolved_date_hint, time_expression, duration_minutes, confidence.",
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
