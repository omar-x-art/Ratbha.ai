/**
 * Local Arabic task extractor — deterministic fallback used before/without Gemini.
 *
 * Splits the user's free text on common Arabic separators and pulls out
 * candidate tasks with date/time hints, durations, and energy estimates.
 *
 * The output mirrors the shape returned by `/api/ai/parse-tasks` so it can
 * be swapped for the live Gemini call later without touching the pipeline.
 */
import type { TaskExtraction } from "@/lib/gemini/schema";

// `\b` word boundary doesn't work with Arabic in JS regex (it's defined in
// terms of [A-Za-z0-9_] only), so we use space-or-edge boundaries instead.
const DATE_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /(^|\s)(اليوم)(\s|$)/, label: "اليوم" },
  { re: /(^|\s)(بكرة|بكره|غداً|غدا)(\s|$)/, label: "بكرة" },
  { re: /(^|\s)(بعد\s*(?:بكرة|بكره|غدا|غداً))(\s|$)/, label: "بعد بكرة" },
  { re: /(?:يوم\s+)?(الأحد|الاحد)(\s|$)/, label: "الأحد" },
  { re: /(?:يوم\s+)?(الإثنين|الاثنين)(\s|$)/, label: "الإثنين" },
  { re: /(?:يوم\s+)?(الثلاثاء)(\s|$)/, label: "الثلاثاء" },
  { re: /(?:يوم\s+)?(الأربعاء|الاربعاء)(\s|$)/, label: "الأربعاء" },
  { re: /(?:يوم\s+)?(الخميس)(\s|$)/, label: "الخميس" },
  { re: /(?:يوم\s+)?(الجمعة)(\s|$)/, label: "الجمعة" },
  { re: /(?:يوم\s+)?(السبت)(\s|$)/, label: "السبت" },
  {
    re: /(الأسبوع|الاسبوع)\s+(القادم|الجاي|المقبل)/,
    label: "الأسبوع القادم",
  },
];

const TIME_HINTS: Array<{ re: RegExp; label: string }> = [
  { re: /(بعد\s+الشغل|بعد\s+العمل)/, label: "بعد الشغل" },
  { re: /(الصبح|صباحاً|صباحا)/, label: "الصبح" },
  { re: /(الظهر|ظهراً|ظهرا)/, label: "الظهر" },
  { re: /(بالليل|في\s+المساء|مساءً|مساءا)/, label: "المساء" },
  // bare hour like "اجتماع 2"
  { re: /(\d{1,2})(?::\d{2})?\s*(?:م|مساءً|مساءا)?/, label: "" },
];

const FIXED_KEYWORDS = /(اجتماع|مكالمة|محاضرة|موعد)/;
const DEEP_WORK_KEYWORDS = /(تقرير|عرض|دراسة|مذاكرة|مراجعة|تخطيط|كتابة)/;
const HABIT_KEYWORDS = /(جيم|رياضة|نادي|مشي|قراءة)/;

function splitClauses(text: string): string[] {
  // Arabic "و" (and) attaches to the next word with no space, so we split
  // on `<space>و<word-char>` and on standalone connectors.
  return text
    .split(/[،,]+|\s+و(?=\S)|\s+ثم\s+|\s+بعدين\s+/)
    .map((s) => s.replace(/^و/, "").trim())
    .filter(Boolean);
}

function detectDateExpression(clause: string): string | null {
  for (const p of DATE_PATTERNS) {
    if (p.re.test(clause)) return p.label;
  }
  return null;
}

function detectTimeHint(clause: string): { label: string; numeric?: number } | null {
  for (const p of TIME_HINTS.slice(0, -1)) {
    if (p.re.test(clause)) return { label: p.label };
  }
  const m = clause.match(/\b(\d{1,2})(?::(\d{2}))?\s*(م|مساءً|مساءا)?\b/);
  if (m) {
    let h = parseInt(m[1], 10);
    if (m[3] && h < 12) h += 12; // PM marker
    if (h >= 0 && h <= 23) return { label: m[0], numeric: h };
  }
  return null;
}

function looksLikeTask(clause: string): boolean {
  if (clause.length < 2) return false;
  // Skip pure date-only clauses ("بكرة" alone is not a task)
  if (
    /^(اليوم|بكرة|بكره|غداً|غدا|الخميس|الجمعة|السبت|الأحد|الاحد|الإثنين|الاثنين|الثلاثاء|الأربعاء|الاربعاء)$/.test(
      clause
    )
  ) {
    return false;
  }
  return true;
}

function classify(clause: string): {
  duration: number;
  priority: "low" | "medium" | "high" | "urgent";
  energy: "low" | "medium" | "high";
  flexibility: "fixed" | "flexible" | "deadline";
  type: string;
} {
  if (FIXED_KEYWORDS.test(clause)) {
    return {
      duration: 60,
      priority: "high",
      energy: "low",
      flexibility: "fixed",
      type: "meeting",
    };
  }
  if (DEEP_WORK_KEYWORDS.test(clause)) {
    return {
      duration: 90,
      priority: "high",
      energy: "high",
      flexibility: "deadline",
      type: "deep_work",
    };
  }
  if (HABIT_KEYWORDS.test(clause)) {
    return {
      duration: 60,
      priority: "medium",
      energy: "medium",
      flexibility: "flexible",
      type: "habit",
    };
  }
  return {
    duration: 30,
    priority: "medium",
    energy: "medium",
    flexibility: "flexible",
    type: "task",
  };
}

function cleanTitle(clause: string): string {
  // Strip leading verbs ("أبي", "أريد", "أخلص", "اعمل", etc.) and date/time hints.
  let t = clause.replace(/\bأ?بي\b|\bأريد\b|\bأبغى\b|\bأبغي\b|\bحاب\b|\bعندي\b/g, "");
  for (const p of DATE_PATTERNS) t = t.replace(p.re, "");
  for (const p of TIME_HINTS) t = t.replace(p.re, "");
  t = t.replace(/\s{2,}/g, " ").trim();
  return t || clause.trim();
}

export function extractTasksLocal(text: string): TaskExtraction {
  const clauses = splitClauses(text);
  const tasks: TaskExtraction["tasks"] = [];
  const fixed: TaskExtraction["fixed_events_mentioned"] = [];
  const ambiguities: TaskExtraction["ambiguities"] = [];

  for (const c of clauses) {
    if (!looksLikeTask(c)) continue;
    const date_expression = detectDateExpression(c);
    const timeHint = detectTimeHint(c);
    const cls = classify(c);
    const title = cleanTitle(c);
    if (!title) continue;

    const item = {
      title,
      date_expression,
      resolved_date_hint: null,
      time_expression: timeHint?.label ?? null,
      duration_minutes: cls.duration,
      priority: cls.priority,
      energy: cls.energy,
      flexibility: cls.flexibility,
      type: cls.type,
      confidence: date_expression ? 0.7 : 0.55,
    };

    if (cls.flexibility === "fixed") {
      fixed.push({
        title,
        date_expression,
        time_expression: timeHint?.label ?? null,
        duration_minutes: cls.duration,
        confidence: 0.8,
      });
    } else {
      tasks.push(item);
    }

    if (timeHint?.label === "بعد الشغل") {
      ambiguities.push({
        text: "بعد الشغل",
        question: "ما وقت انتهاء العمل لديك؟",
        fallback: "18:00",
      });
    }
  }

  return {
    language: "ar",
    timezone: "Asia/Riyadh",
    tasks,
    fixed_events_mentioned: fixed,
    ambiguities,
  };
}
