/**
 * Gemini provider switch.
 *
 * - When `GEMINI_API_KEY` is set, calls Gemini's REST API and validates
 *   the JSON output against `TaskExtractionSchema`.
 * - Otherwise, falls back to the deterministic local extractor — the
 *   UI works the same way, no flag needed in the calling code.
 */
import {
  TaskExtractionSchema,
  type TaskExtraction,
} from "@/lib/gemini/schema";
import { extractTasksLocal } from "@/lib/gemini/local-extractor";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface ExtractOptions {
  text: string;
  timezone?: string;
  locale?: string;
}

export async function extractTasks(
  opts: ExtractOptions
): Promise<TaskExtraction> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return extractTasksLocal(opts.text);

  const prompt = buildPrompt(opts);
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    return extractTasksLocal(opts.text);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) return extractTasksLocal(opts.text);

  try {
    const parsed = TaskExtractionSchema.parse(JSON.parse(raw));
    return parsed;
  } catch {
    return extractTasksLocal(opts.text);
  }
}

function buildPrompt({ text, timezone, locale }: ExtractOptions) {
  return [
    "أنت محرّك استخراج مهام عربي. استخرج المهام من النص التالي وأرجع JSON فقط بالشكل المطلوب.",
    `الـ timezone: ${timezone ?? "Asia/Riyadh"}.`,
    `اللغة: ${locale ?? "ar"}.`,
    "الحقول المطلوبة:",
    "{",
    '  "language": "ar",',
    '  "timezone": "...",',
    '  "tasks": [{ "title", "date_expression", "time_expression", "duration_minutes", "priority", "energy", "flexibility", "type", "confidence" }],',
    '  "fixed_events_mentioned": [{ "title", "date_expression", "time_expression", "duration_minutes", "confidence" }],',
    '  "ambiguities": [{ "text", "question", "fallback" }]',
    "}",
    "النص:",
    text,
  ].join("\n");
}
