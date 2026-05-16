import { resolveArabicDate } from "@/lib/date/arabic-date-resolver";
import { TaskExtractionSchema, type TaskExtraction } from "@/lib/gemini/schema";
import {
  scheduleTasks,
  type TaskRequest,
} from "@/lib/schedule/scheduling-engine";
import { arabicWeekday } from "@/lib/utils";
import type {
  DayBucket,
  Energy,
  Flexibility,
  Plan,
  PlanItem,
  Priority,
  Task,
} from "@/lib/types";

interface BuildPlanOptions {
  now?: Date;
  timezone?: string;
}

export interface BuildPlanResult {
  extraction: TaskExtraction;
  plan: Plan;
}

interface ParsedTask {
  id: string;
  title: string;
  original: string;
  dateExpression: string | null;
  timeExpression: string | null;
  date: Date | null;
  duration_minutes: number;
  priority: Priority;
  energy: Energy;
  flexibility: Flexibility;
  confidence: number;
}

interface ParsedFixedEvent {
  id: string;
  title: string;
  original: string;
  dateExpression: string | null;
  timeExpression: string | null;
  date: Date;
  duration_minutes: number;
  confidence: number;
}

interface DayDraft {
  date: Date;
  lockedItems: PlanItem[];
  requests: TaskRequest[];
}

const DATE_EXPRESSIONS = [
  "بعد بكرة",
  "بعد بكره",
  "بعد غدا",
  "بعد غداً",
  "الأسبوع القادم",
  "الاسبوع القادم",
  "الأسبوع الجاي",
  "الاسبوع الجاي",
  "اليوم",
  "بكرة",
  "بكره",
  "غداً",
  "غدا",
  "الأحد",
  "الاحد",
  "الإثنين",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الاربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const ARABIC_DIGITS: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

export function buildPlanFromText(
  input: string,
  options: BuildPlanOptions = {}
): BuildPlanResult {
  const now = options.now ?? new Date();
  const timezone = options.timezone ?? "Africa/Cairo";
  const segments = splitInput(input);
  const parsedTasks: ParsedTask[] = [];
  const fixedEvents: ParsedFixedEvent[] = [];
  const inbox: Task[] = [];

  segments.forEach((segment, index) => {
    if (isAmbiguous(segment)) {
      inbox.push(createInboxTask(segment, index, "متى تحب أن أضع هذه المهمة؟"));
      return;
    }

    const dateExpression = findDateExpression(segment);
    const dateResult = resolveSegmentDate(segment, dateExpression, now);
    const date = dateResult.date;
    const time = parseTimeExpression(segment);
    const duration = parseDuration(segment);

    if (!date && dateResult.confidence < 0.5) {
      inbox.push(createInboxTask(segment, index, "أي يوم تقصد؟"));
      return;
    }

    if (isFixedEvent(segment)) {
      fixedEvents.push({
        id: `fixed-${index + 1}`,
        title: cleanTitle(segment),
        original: segment,
        dateExpression,
        timeExpression: time?.label ?? null,
        date: date ?? startOfDay(now),
        duration_minutes: duration,
        confidence: time ? 0.86 : 0.68,
      });
      return;
    }

    parsedTasks.push({
      id: `task-${index + 1}`,
      title: cleanTitle(segment),
      original: segment,
      dateExpression,
      timeExpression: time?.label ?? null,
      date: date ?? startOfDay(now),
      duration_minutes: duration,
      priority: inferPriority(segment),
      energy: inferEnergy(segment),
      flexibility: time ? "fixed" : inferFlexibility(segment),
      confidence: dateExpression || time ? 0.82 : 0.68,
    });
  });

  if (segments.length === 0 || (parsedTasks.length === 0 && fixedEvents.length === 0 && inbox.length === 0)) {
    inbox.push(createInboxTask(input.trim(), 0, "اكتب المهمة بشكل أوضح لأرتبها لك."));
  }

  const dayDrafts = new Map<string, DayDraft>();

  fixedEvents.forEach((event) => {
    const item = createFixedPlanItem(event);
    const key = toDateKey(event.date);
    const draft = ensureDayDraft(dayDrafts, event.date);
    draft.lockedItems.push(item);
    dayDrafts.set(key, draft);
  });

  parsedTasks.forEach((task) => {
    const key = toDateKey(task.date ?? now);
    const draft = ensureDayDraft(dayDrafts, task.date ?? now);
    const time = parseTimeExpression(task.original);

    if (time) {
      const item = createTimedTaskItem(task, time);
      draft.lockedItems.push(item);
      dayDrafts.set(key, draft);
      return;
    }

    draft.requests.push({
      id: task.id,
      title: task.title,
      duration_minutes: task.duration_minutes,
      priority: task.priority,
      energy: task.energy,
      flexibility: task.flexibility,
    });
    dayDrafts.set(key, draft);
  });

  const buckets = Array.from(dayDrafts.values())
    .sort((a, b) => startOfDay(a.date).getTime() - startOfDay(b.date).getTime())
    .map((draft) => buildBucket(draft, now, inbox));

  const extraction = TaskExtractionSchema.parse({
    language: "ar",
    timezone,
    tasks: parsedTasks.map((task) => ({
      title: task.title,
      date_expression: task.dateExpression,
      resolved_date_hint: task.date ? toDateKey(task.date) : null,
      time_expression: task.timeExpression,
      duration_minutes: task.duration_minutes,
      priority: task.priority,
      energy: task.energy,
      flexibility: task.flexibility,
      confidence: task.confidence,
    })),
    fixed_events_mentioned: fixedEvents.map((event) => ({
      title: event.title,
      date_expression: event.dateExpression,
      time_expression: event.timeExpression,
      duration_minutes: event.duration_minutes,
      confidence: event.confidence,
    })),
    ambiguities: inbox.map((task) => ({
      text: task.title,
      question: task.reason ?? "متى تريد ترتيبها؟",
    })),
  });

  return {
    extraction,
    plan: {
      id: `plan-${Date.now()}`,
      title: "خطتك المقترحة",
      status: "draft",
      ai_model: "local",
      input_text: input,
      buckets,
      inbox,
    },
  };
}

function buildBucket(draft: DayDraft, now: Date, inbox: Task[]): DayBucket {
  const busy = draft.lockedItems.map((item) => ({
    start: new Date(item.start_time).getTime(),
    end: new Date(item.end_time).getTime(),
    title: item.title,
    isMeeting: item.item_type === "existing_event",
  }));
  const windowStart = startOfDay(draft.date).getTime();
  const windowEnd = addDays(startOfDay(draft.date), 1).getTime();
  const scheduled = scheduleTasks(draft.requests, busy, windowStart, windowEnd);
  const scheduledItems = scheduled.scheduled.map((item) => ({
    id: item.id,
    title: item.title,
    start_time: new Date(item.start).toISOString(),
    end_time: new Date(item.end).toISOString(),
    item_type: "proposed_task" as const,
    reason: item.reason,
  }));

  scheduled.unscheduled.forEach((task, index) => {
    inbox.push(
      createInboxTask(
        task.title,
        Number(task.id.replace(/\D/g, "")) || index,
        "لم أجد وقتاً مناسباً لها في هذا اليوم."
      )
    );
  });

  const items = [...draft.lockedItems, ...scheduledItems].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return {
    date: toDateKey(draft.date),
    label: bucketLabel(draft.date, now),
    arabicLabel: bucketArabicLabel(draft.date, now),
    items,
  };
}

function splitInput(input: string) {
  return input
    .replace(/\s+و(?=(?:عندي|عندى|عايز|أريد|اريد|لازم|الجيم|أروح|اروح|أخلص|اخلص|راجع|كلم|أكلم|اكلم|مكالمة|اجتماع))/g, "،")
    .split(/[،,؛;\n]+/)
    .map((part) => part.trim().replace(/^و+/, "").trim())
    .filter(Boolean);
}

function normalizeDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, (digit) => ARABIC_DIGITS[digit] ?? digit);
}

function findDateExpression(segment: string) {
  return DATE_EXPRESSIONS.find((expression) => segment.includes(expression)) ?? null;
}

function resolveSegmentDate(
  segment: string,
  dateExpression: string | null,
  now: Date
) {
  if (dateExpression) return resolveArabicDate(dateExpression, now);
  const loose = resolveArabicDate(segment, now);
  if (loose.date || loose.confidence > 0) return loose;
  return { date: startOfDay(now), confidence: 0.6, reason: "default_today" };
}

function parseTimeExpression(segment: string) {
  const normalized = normalizeDigits(segment);

  if (/(بعد\s+الشغل|بعد\s+العمل)/.test(normalized)) {
    return { hour: 18, minute: 30, label: "بعد الشغل" };
  }

  if (/(الصبح|صباحاً|صباحا)/.test(normalized)) {
    return { hour: 9, minute: 0, label: "الصبح" };
  }

  const explicit = normalized.match(
    /(?:الساعة|الساعه|ساعة|س)\s*(\d{1,2})(?::(\d{2}))?/
  );
  const loose = normalized.match(/\b(\d{1,2})(?::(\d{2}))?\b/);
  const match = explicit ?? (/(اجتماع|مكالمة|ميعاد|موعد)/.test(normalized) ? loose : null);

  if (!match) return null;

  const rawHour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  const hour = normalizeHour(rawHour, normalized);

  return {
    hour,
    minute,
    label: `الساعة ${rawHour}${minute ? `:${`${minute}`.padStart(2, "0")}` : ""}`,
  };
}

function normalizeHour(hour: number, segment: string) {
  if (/(صباح|صباحاً|صباحا|ص\b)/.test(segment)) return hour;
  if (/(مساء|مساءً|مساءا|م\b)/.test(segment) && hour < 12) return hour + 12;
  if (hour >= 1 && hour <= 7) return hour + 12;
  return hour;
}

function parseDuration(segment: string) {
  const normalized = normalizeDigits(segment);
  const duration = normalized.match(/(\d+)\s*(دقيقة|دقايق|ساعة|ساعات)/);

  if (duration) {
    const value = Number(duration[1]);
    return duration[2].startsWith("ساعة") || duration[2].startsWith("ساعات")
      ? value * 60
      : value;
  }

  if (/(عرض|تقرير|مذاكرة|دراسة|كتابة|برمجة)/.test(segment)) return 90;
  if (/(جيم|تمرين|رياضة)/.test(segment)) return 60;
  if (/(اجتماع|مكالمة|اتصال)/.test(segment)) return 45;
  return 30;
}

function inferPriority(segment: string): Priority {
  if (/(ضروري|عاجل|لازم|مهم جداً|مهم جدا)/.test(segment)) return "urgent";
  if (/(مهم|عرض|تقرير|عميل|موعد)/.test(segment)) return "high";
  return "medium";
}

function inferEnergy(segment: string): Energy {
  if (/(عرض|تقرير|كتابة|برمجة|دراسة|مذاكرة)/.test(segment)) return "high";
  if (/(مكالمة|اتصال|مراجعة|راجع)/.test(segment)) return "low";
  return "medium";
}

function inferFlexibility(segment: string): Flexibility {
  if (/(قبل|آخر|اخر|موعد|deadline|تسليم)/.test(segment)) return "deadline";
  return "flexible";
}

function isFixedEvent(segment: string) {
  return /(عندي|عندى|موعد|ميعاد|اجتماع)/.test(segment) && /(اجتماع|موعد|ميعاد|مكالمة)/.test(segment);
}

function isAmbiguous(segment: string) {
  return /(لما\s+أفضى|لما\s+افضى|وقت\s+فراغ|أقرب\s+فراغ|اقرب\s+فراغ)/.test(segment);
}

function cleanTitle(segment: string) {
  const withoutDate = DATE_EXPRESSIONS.reduce(
    (title, expression) => title.replace(expression, ""),
    segment
  );
  return withoutDate
    .replace(/(?:الساعة|الساعه|ساعة|س)\s*[٠-٩۰-۹\d]{1,2}(?::[٠-٩۰-۹\d]{2})?/g, "")
    .replace(/(بعد\s+الشغل|بعد\s+العمل|الصبح|صباحاً|صباحا)/g, "")
    .replace(/^(عايز|أريد|اريد|لازم|عندي|عندى|أحتاج|احتاج|أخلص|اخلص|أروح|اروح)\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function createFixedPlanItem(event: ParsedFixedEvent): PlanItem {
  const time = parseTimeExpression(event.original);
  const start = withTime(event.date, time?.hour ?? 9, time?.minute ?? 0);
  const end = new Date(start.getTime() + event.duration_minutes * 60_000);

  return {
    id: event.id,
    title: event.title,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    item_type: "existing_event",
    is_locked: true,
    reason: "اعتبرته موعداً ثابتاً من كلامك",
  };
}

function createTimedTaskItem(
  task: ParsedTask,
  time: { hour: number; minute: number; label: string }
): PlanItem {
  const start = withTime(task.date ?? new Date(), time.hour, time.minute);
  const end = new Date(start.getTime() + task.duration_minutes * 60_000);

  return {
    id: task.id,
    title: task.title,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    item_type: "proposed_task",
    reason: `وضعتها حسب "${time.label}"`,
  };
}

function createInboxTask(title: string, index: number, reason: string): Task {
  return {
    id: `inbox-local-${index + 1}-${Date.now()}`,
    title: title || "مهمة غير واضحة",
    status: "inbox",
    duration_minutes: parseDuration(title),
    priority: inferPriority(title),
    energy: inferEnergy(title),
    flexibility: "flexible",
    reason,
  };
}

function ensureDayDraft(map: Map<string, DayDraft>, date: Date) {
  const key = toDateKey(date);
  const existing = map.get(key);
  if (existing) return existing;
  return {
    date: startOfDay(date),
    lockedItems: [],
    requests: [],
  };
}

function withTime(date: Date, hour: number, minute: number) {
  const out = startOfDay(date);
  out.setHours(hour, minute, 0, 0);
  return out;
}

function startOfDay(date: Date) {
  const out = new Date(date);
  out.setHours(0, 0, 0, 0);
  return out;
}

function addDays(date: Date, days: number) {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
}

function toDateKey(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function isSameDate(a: Date, b: Date) {
  return toDateKey(a) === toDateKey(b);
}

function bucketLabel(date: Date, now: Date) {
  if (isSameDate(date, now)) return "today";
  if (isSameDate(date, addDays(now, 1))) return "tomorrow";
  return "later";
}

function bucketArabicLabel(date: Date, now: Date) {
  if (isSameDate(date, now)) return "اليوم";
  if (isSameDate(date, addDays(now, 1))) return "غداً";
  return arabicWeekday(date);
}
