import { resolveArabicDate } from "@/lib/date/arabic-date-resolver";
import { TaskExtractionSchema, type TaskExtraction } from "@/lib/gemini/schema";
import {
  scheduleTasks,
  type TaskRequest,
} from "@/lib/schedule/scheduling-engine";
import { arabicWeekday } from "@/lib/utils";
import type { CalendarBusyEvent } from "@/lib/google/calendar";
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
  calendarEvents?: CalendarBusyEvent[];
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

interface ParsedTimeExpression {
  hour: number;
  minute: number;
  label: string;
}

interface ParsedTimeRange {
  start: ParsedTimeExpression;
  end: ParsedTimeExpression;
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
  "النهاردة",
  "انهاردة",
  "اليوم",
  "بكرا",
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

export function buildPlanFromExtraction(
  input: string,
  extraction: TaskExtraction,
  options: BuildPlanOptions = {}
): BuildPlanResult {
  const now = options.now ?? new Date();
  const timezone = options.timezone ?? extraction.timezone ?? "Africa/Cairo";

  const parsedTasks: ParsedTask[] = extraction.tasks.map((task, index) => {
    const dateExpression = task.date_expression ?? null;
    const timeExpression = task.time_expression ?? null;
    const time = timeExpression ? parseTimeExpression(timeExpression) : null;
    const date =
      resolveExtractionDate(task.resolved_date_hint ?? null, dateExpression, now) ??
      startOfDay(now);

    return {
      id: `task-${index + 1}`,
      title: cleanTitle(task.title),
      original: [task.title, dateExpression, renderTimeForOriginal(timeExpression)]
        .filter(Boolean)
        .join(" "),
      dateExpression,
      timeExpression: time?.label ?? timeExpression,
      date,
      duration_minutes: normalizeDuration(task.duration_minutes),
      priority: task.priority,
      energy: task.energy,
      flexibility: timeExpression ? "fixed" : task.flexibility,
      confidence: task.confidence,
    };
  });

  const fixedEvents: ParsedFixedEvent[] = extraction.fixed_events_mentioned.map(
    (event, index) => {
      const dateExpression = event.date_expression ?? null;
      const timeExpression = event.time_expression ?? null;
      const time = timeExpression ? parseTimeExpression(timeExpression) : null;
      const date =
        resolveExtractionDate(event.resolved_date_hint ?? null, dateExpression, now) ??
        startOfDay(now);

      return {
        id: `fixed-${index + 1}`,
        title: cleanTitle(event.title),
        original: [event.title, dateExpression, renderTimeForOriginal(timeExpression)]
          .filter(Boolean)
          .join(" "),
        dateExpression,
        timeExpression: time?.label ?? timeExpression,
        date,
        duration_minutes: normalizeDuration(event.duration_minutes),
        confidence: event.confidence,
      };
    }
  );

  const inbox = extraction.ambiguities.map((item, index) =>
    createInboxTask(cleanTitle(item.text), index, item.question)
  );

  return createPlanResult({
    input,
    timezone,
    now,
    parsedTasks,
    fixedEvents,
    inbox,
    calendarEvents: options.calendarEvents,
  });
}

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

  return createPlanResult({
    input,
    timezone,
    now,
    parsedTasks,
    fixedEvents,
    inbox,
    calendarEvents: options.calendarEvents,
  });
}

function createPlanResult({
  input,
  timezone,
  now,
  parsedTasks,
  fixedEvents,
  inbox,
  calendarEvents = [],
}: {
  input: string;
  timezone: string;
  now: Date;
  parsedTasks: ParsedTask[];
  fixedEvents: ParsedFixedEvent[];
  inbox: Task[];
  calendarEvents?: CalendarBusyEvent[];
}): BuildPlanResult {
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
    .map((draft) => buildBucket(draft, now, inbox, calendarEvents));

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
      resolved_date_hint: toDateKey(event.date),
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

function buildBucket(
  draft: DayDraft,
  now: Date,
  inbox: Task[],
  calendarEvents: CalendarBusyEvent[]
): DayBucket {
  const externalBusy = calendarEvents
    .filter((event) => shouldUseCalendarEventAsBusy(event, draft.date))
    .map((event) => ({
      start: new Date(event.start).getTime(),
      end: new Date(event.end).getTime(),
      title: event.title,
      isMeeting: event.isMeeting,
    }));
  const busy = [
    ...draft.lockedItems.map((item) => ({
      start: new Date(item.start_time).getTime(),
      end: new Date(item.end_time).getTime(),
      title: item.title,
      isMeeting: item.item_type === "existing_event",
    })),
    ...externalBusy,
  ];
  const windowStart = schedulingWindowStart(draft.date, now).getTime();
  const windowEnd = addDays(startOfDay(draft.date), 1).getTime();
  const scheduled = scheduleTasks(draft.requests, busy, windowStart, windowEnd);
  const scheduledItems = scheduled.scheduled.map((item) => ({
    id: item.id,
    title: item.title,
    start_time: new Date(item.start).toISOString(),
    end_time: new Date(item.end).toISOString(),
    item_type: "proposed_task" as const,
    show_in_calendar: true,
    reason:
      externalBusy.length > 0
        ? `${item.reason} مع مراعاة مواعيد التقويم`
        : item.reason,
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
    .replace(/\s+و(?=(?:عندي|عندى|عايز|عاوز|أريد|اريد|لازم|النهاردة|انهاردة|اليوم|بكرا|بكرة|بكره|غدا|غداً|الجيم|أروح|اروح|أخلص|اخلص|خلص|راجع|أراجع|اكتب|أكتب|اشتري|أشتري|ادفع|أدفع|ذاكر|أذاكر|حضر|أحضر|كلم|أكلم|اكلم|مكالمة|اجتماع))/g, "،")
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
  const range = parseTimeRange(normalized);

  if (range) {
    return {
      hour: range.start.hour,
      minute: range.start.minute,
      label: `من الساعة ${formatClockLabel(range.start)}`,
    };
  }

  if (/(بعد\s+الشغل|بعد\s+العمل)/.test(normalized)) {
    return { hour: 18, minute: 30, label: "بعد الشغل" };
  }

  const explicit = normalized.match(
    /(?:الساعة|الساعه|ساعة|س)\s*(\d{1,2})(?::(\d{2}))?\s*(صباحاً|صباحا|صباح|مساءً|مساءا|مساء|ص|م)?/
  );
  const meridiemLoose = normalized.match(
    /\b(\d{1,2})(?::(\d{2}))?\s*(صباحاً|صباحا|صباح|مساءً|مساءا|مساء|ص|م)\b/
  );
  const loose = normalized.match(/\b(\d{1,2})(?::(\d{2}))?\b/);
  const bare = normalized.trim().match(/^(\d{1,2})(?::(\d{2}))?$/);
  const match =
    explicit ??
    meridiemLoose ??
    bare ??
    (/(اجتماع|مكالمة|ميعاد|موعد)/.test(normalized) ? loose : null);

  if (match) {
    const rawHour = Number(match[1]);
    const minute = match[2] ? Number(match[2]) : 0;
    const meridiem = match[3] ?? "";
    const hour = normalizeHour(rawHour, `${normalized} ${meridiem}`);

    return {
      hour,
      minute,
      label: `الساعة ${rawHour}${minute ? `:${`${minute}`.padStart(2, "0")}` : ""}`,
    };
  }

  if (/(الصبح|صباحاً|صباحا|بداية\s+اليوم)/.test(normalized)) {
    return { hour: 9, minute: 0, label: "الصبح" };
  }

  if (/(الظهر|بعد\s+الظهر)/.test(normalized)) {
    return { hour: 13, minute: 0, label: "بعد الظهر" };
  }

  if (/(العصر|آخر\s+النهار|اخر\s+النهار)/.test(normalized)) {
    return { hour: 16, minute: 0, label: "العصر" };
  }

  if (/(المغرب|بداية\s+المساء)/.test(normalized)) {
    return { hour: 18, minute: 0, label: "المغرب" };
  }

  if (/(بالليل|الليل|آخر\s+اليوم|اخر\s+اليوم|المساء)/.test(normalized)) {
    return { hour: 19, minute: 30, label: "المساء" };
  }

  return null;
}

function normalizeHour(hour: number, segment: string) {
  if (/(صباح|صباحاً|صباحا|ص\b)/.test(segment)) return hour;
  if (/(مساء|مساءً|مساءا|ليل|العصر|المغرب|م\b)/.test(segment) && hour < 12) return hour + 12;
  if (hour >= 1 && hour <= 7) return hour + 12;
  return hour;
}

function parseDuration(segment: string) {
  const normalized = normalizeDigits(segment);
  const range = parseTimeRange(normalized);
  if (range) return Math.max(15, minutesBetween(range.start, range.end));

  if (/(نص\s+ساعة|نصف\s+ساعة)/.test(normalized)) return 30;
  if (/(ربع\s+ساعة)/.test(normalized)) return 15;
  if (/(ساعتين|ساعتان)/.test(normalized)) return 120;
  if (/(ساعة\s+ونص|ساعة\s+ونصف)/.test(normalized)) return 90;

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
  if (/(عرض|تقرير|كتابة|برمجة|دراسة|مذاكرة|تحضير|تحليل)/.test(segment)) return "high";
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
  const cleaned = withoutDate
    .replace(/(?:من|مِن)\s*[٠-٩۰-۹\d]{1,2}(?::[٠-٩۰-۹\d]{2})?\s*(?:لـ?|إلى|الى|حتى|لحد)\s*[٠-٩۰-۹\d]{1,2}(?::[٠-٩۰-۹\d]{2})?/g, "")
    .replace(/(?:الساعة|الساعه|ساعة|س)\s*[٠-٩۰-۹\d]{1,2}(?::[٠-٩۰-۹\d]{2})?\s*(صباحاً|صباحا|صباح|مساءً|مساءا|مساء|ص|م)?/g, "")
    .replace(/\b[٠-٩۰-۹\d]{1,2}(?::[٠-٩۰-۹\d]{2})?\s*(صباحاً|صباحا|صباح|مساءً|مساءا|مساء|ص|م)\b/g, "")
    .replace(/\d+\s*(دقيقة|دقايق|ساعة|ساعات)/g, "")
    .replace(/(نص\s+ساعة|نصف\s+ساعة|ربع\s+ساعة|ساعتين|ساعتان|ساعة\s+ونص|ساعة\s+ونصف)/g, "")
    .replace(/(بعد\s+الشغل|بعد\s+العمل|الصبح|صباحاً|صباحا|الظهر|بعد\s+الظهر|العصر|المغرب|بالليل|الليل|المساء)/g, "")
    .replace(/^(أنا|انا|إحنا|احنا)\s+/g, "")
    .replace(/^(عايز|عاوز|أريد|اريد|لازم|المفروض|محتاج|أحتاج|احتاج|عندي|عندى)\s+/g, "")
    .replace(/^(أن|ان|إني|اني)\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return rewriteTaskTitle(cleaned);
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
    show_in_calendar: true,
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

function schedulingWindowStart(date: Date, now: Date) {
  if (!isSameDate(date, now)) return startOfDay(date);
  return roundUpToQuarter(now);
}

function roundUpToQuarter(date: Date) {
  const out = new Date(date);
  const minutes = out.getMinutes();
  const nextQuarter = Math.ceil(minutes / 15) * 15;
  out.setMinutes(nextQuarter, 0, 0);
  return out;
}

function shouldUseCalendarEventAsBusy(event: CalendarBusyEvent, date: Date) {
  if (event.isAllDay) return false;
  return toDateKey(new Date(event.start)) === toDateKey(date);
}

function parseTimeRange(segment: string): ParsedTimeRange | null {
  const normalized = normalizeDigits(segment);
  const match = normalized.match(
    /(?:من|مِن)\s*(\d{1,2})(?::(\d{2}))?\s*(?:لـ?|إلى|الى|حتى|لحد)\s*(\d{1,2})(?::(\d{2}))?/
  );

  if (!match) return null;

  const start = {
    hour: normalizeHour(Number(match[1]), normalized),
    minute: match[2] ? Number(match[2]) : 0,
    label: formatClockLabel({
      hour: normalizeHour(Number(match[1]), normalized),
      minute: match[2] ? Number(match[2]) : 0,
    }),
  };
  let endHour = normalizeHour(Number(match[3]), normalized);
  const endMinute = match[4] ? Number(match[4]) : 0;

  if (endHour * 60 + endMinute <= start.hour * 60 + start.minute) {
    endHour += 12;
  }

  return {
    start: { ...start, label: `الساعة ${start.label}` },
    end: {
      hour: endHour,
      minute: endMinute,
      label: `الساعة ${formatClockLabel({ hour: endHour, minute: endMinute })}`,
    },
  };
}

function minutesBetween(start: ParsedTimeExpression, end: ParsedTimeExpression) {
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;
  return endMinutes > startMinutes
    ? endMinutes - startMinutes
    : endMinutes + 24 * 60 - startMinutes;
}

function formatClockLabel(time: Pick<ParsedTimeExpression, "hour" | "minute">) {
  const hour = time.hour > 12 ? time.hour - 12 : time.hour;
  return `${hour}${time.minute ? `:${`${time.minute}`.padStart(2, "0")}` : ""}`;
}

function normalizeDuration(duration: number) {
  if (!Number.isFinite(duration)) return 30;
  return Math.max(15, Math.min(480, Math.round(duration)));
}

function resolveExtractionDate(
  dateHint: string | null,
  dateExpression: string | null,
  now: Date
) {
  const hinted = parseDateHint(dateHint);
  if (hinted) return hinted;
  if (dateExpression) return resolveArabicDate(dateExpression, now).date;
  return startOfDay(now);
}

function parseDateHint(value: string | null) {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function renderTimeForOriginal(timeExpression: string | null) {
  if (!timeExpression) return null;
  return /(الساعة|الساعه|ساعة|س\s|صباح|مساء|من\s)/.test(timeExpression)
    ? timeExpression
    : `الساعة ${timeExpression}`;
}

function rewriteTaskTitle(title: string) {
  const text = title
    .replace(/^(أن|ان|إني|اني)\s+/g, "")
    .replace(/(إن شاء الله|ان شاء الله|لو سمحت|من فضلك)$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "مهمة جديدة";

  const call = text.match(/^(?:أكلم|اكلم|كلم)\s+(.+)/);
  if (call) return `مكالمة مع ${cleanTitleObject(call[1])}`;

  const contact = text.match(/^(?:أتصل|اتصل)\s+ب?(.+)/);
  if (contact) return `اتصال مع ${cleanTitleObject(contact[1])}`;

  if (/^(?:أروح|اروح|اذهب|أذهب)\s+(?:لل?|إلى\s+)?(?:ال)?جيم/.test(text)) {
    return "تمرين في الجيم";
  }

  const finish = text.match(/^(?:أخلص|اخلص|خلص|أنهي|انهي)\s+(.+)/);
  if (finish) return `إنهاء ${cleanTitleObject(finish[1])}`;

  const review = text.match(/^(?:أراجع|اراجع|راجع)\s+(.+)/);
  if (review) return `مراجعة ${cleanTitleObject(review[1])}`;

  const write = text.match(/^(?:أكتب|اكتب|كتب)\s+(.+)/);
  if (write) return `كتابة ${cleanTitleObject(write[1])}`;

  const prepare = text.match(/^(?:أحضر|احضر|حضّر|حضر)\s+(.+)/);
  if (prepare) return `تحضير ${cleanTitleObject(prepare[1])}`;

  const buy = text.match(/^(?:أشتري|اشتري|اشترى|شراء)\s+(.+)/);
  if (buy) return `شراء ${cleanTitleObject(buy[1])}`;

  const pay = text.match(/^(?:أدفع|ادفع|دفع)\s+(.+)/);
  if (pay) return `دفع ${cleanTitleObject(pay[1])}`;

  const study = text.match(/^(?:أذاكر|اذاكر|ذاكر|مذاكرة)\s+(.+)/);
  if (study) return `مذاكرة ${cleanTitleObject(study[1])}`;

  const read = text.match(/^(?:أقرأ|اقرأ|قراءة)\s+(.+)/);
  if (read) return `قراءة ${cleanTitleObject(read[1])}`;

  const arrange = text.match(/^(?:أرتب|ارتب|رتب)\s+(.+)/);
  if (arrange) return `ترتيب ${cleanTitleObject(arrange[1])}`;

  return text;
}

function cleanTitleObject(value: string) {
  return value
    .replace(/^(?:مع|لـ|ل|ب)\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
