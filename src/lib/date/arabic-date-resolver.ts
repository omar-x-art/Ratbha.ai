/**
 * Arabic relative-date resolver.
 * Maps natural Arabic expressions ("بكرة"، "الخميس"، "الأسبوع القادم")
 * to absolute dates relative to a `now` reference.
 *
 * MVP scope: the most common expressions only. Confidence < 1 means
 * the caller should ask the user to confirm.
 */

export interface ResolvedDate {
  date: Date | null;
  confidence: number; // 0..1
  reason?: string;
}

const WEEKDAY_AR: Record<string, number> = {
  // 0=Sun, 1=Mon, ..., 6=Sat
  "الأحد": 0,
  "الاحد": 0,
  "الإثنين": 1,
  "الاثنين": 1,
  "الثلاثاء": 2,
  "الأربعاء": 3,
  "الاربعاء": 3,
  "الخميس": 4,
  "الجمعة": 5,
  "السبت": 6,
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function nextWeekday(now: Date, weekday: number): Date {
  const today = startOfDay(now);
  const day = today.getDay();
  let diff = (weekday - day + 7) % 7;
  if (diff === 0) diff = 7;
  const out = new Date(today);
  out.setDate(today.getDate() + diff);
  return out;
}

export function resolveArabicDate(input: string, now: Date = new Date()): ResolvedDate {
  const txt = input.trim();
  if (!txt) return { date: null, confidence: 0 };

  const today = startOfDay(now);

  if (/^(اليوم|النهاردة|انهاردة)$/.test(txt)) {
    return { date: today, confidence: 1, reason: "today" };
  }
  if (/^(بكرة|بكره|بكرا|غداً|غدا)$/.test(txt)) {
    const d = new Date(today);
    d.setDate(today.getDate() + 1);
    return { date: d, confidence: 1, reason: "tomorrow" };
  }
  if (/^(بعد بكرة|بعد بكره|بعد غدا|بعد غداً)$/.test(txt)) {
    const d = new Date(today);
    d.setDate(today.getDate() + 2);
    return { date: d, confidence: 1, reason: "day_after_tomorrow" };
  }
  if (/(الأسبوع|الاسبوع)\s*(القادم|الجاي|المقبل)/.test(txt)) {
    const d = new Date(today);
    d.setDate(today.getDate() + 7);
    return { date: d, confidence: 0.8, reason: "next_week" };
  }
  // Specific weekday like "الخميس" or "يوم الخميس"
  const m = txt.match(/(?:يوم\s+)?(الأحد|الاحد|الإثنين|الاثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|الجمعة|السبت)/);
  if (m) {
    const wd = WEEKDAY_AR[m[1]];
    return { date: nextWeekday(today, wd), confidence: 0.9, reason: `weekday:${m[1]}` };
  }
  if (/(بعد\s+الشغل|بعد\s+العمل|بالليل|في\s+المساء|مساءً|مساءا)/.test(txt)) {
    return { date: today, confidence: 0.5, reason: "after_work_or_evening" };
  }
  if (/(لما\s+أفضى|لما\s+افضى|في\s+أقرب\s+فراغ)/.test(txt)) {
    return { date: null, confidence: 0.4, reason: "flexible" };
  }
  return { date: null, confidence: 0 };
}
