import type { Plan, PlanItem, DayBucket } from "@/lib/types";

function atTime(daysFromToday: number, h: number, m = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function plus(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const today = new Date();
const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);

const todayItems: PlanItem[] = [
  {
    id: "demo-1",
    title: "اجتماع تخطيط الفريق",
    start_time: atTime(0, 11, 0),
    end_time: atTime(0, 12, 0),
    item_type: "existing_event",
    is_locked: true,
    reason: "موجود في تقويمك",
  },
  {
    id: "demo-2",
    title: "إنهاء التقرير الشهري",
    start_time: atTime(0, 9, 0),
    end_time: plus(atTime(0, 9, 0), 90),
    item_type: "proposed_task",
    reason: "اخترنا الصباح لأنها مهمة عالية الطاقة.",
  },
  {
    id: "demo-3",
    title: "الجيم",
    start_time: atTime(0, 18, 0),
    end_time: atTime(0, 19, 0),
    item_type: "proposed_task",
    reason: "وضعناها في المساء لأنها مهمة خفيفة.",
  },
];

const tomorrowItems: PlanItem[] = [
  {
    id: "demo-4",
    title: "مكالمة مع العميل",
    start_time: atTime(1, 14, 0),
    end_time: atTime(1, 15, 0),
    item_type: "proposed_task",
    reason: "وقت مناسب بعد الظهر.",
  },
  {
    id: "demo-5",
    title: "مراجعة الميزانية",
    start_time: atTime(1, 10, 0),
    end_time: plus(atTime(1, 10, 0), 60),
    item_type: "proposed_task",
    reason: "أولوية عالية.",
  },
];

const buckets: DayBucket[] = [
  {
    date: ymd(today),
    label: "today",
    arabicLabel: "اليوم",
    items: todayItems.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    ),
  },
  {
    date: ymd(tomorrow),
    label: "tomorrow",
    arabicLabel: "غداً",
    items: tomorrowItems.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    ),
  },
];

export const DEMO_PLAN: Plan = {
  id: "demo-plan",
  title: "خطة تجريبية",
  status: "draft",
  ai_model: "demo",
  input_text:
    "يومين كامل: تقرير، اجتماع، جيم، مكالمة عميل، ومراجعة ميزانية.",
  buckets,
  inbox: [
    {
      id: "demo-inbox-1",
      title: "الرد على بريد المورد",
      status: "inbox",
      duration_minutes: 15,
      priority: "low",
      energy: "low",
      flexibility: "flexible",
      reason: "لم تذكر موعداً — متى يناسبك؟",
    },
  ],
};
