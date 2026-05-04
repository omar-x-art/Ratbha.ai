import type { Plan, PlanItem, DayBucket } from "@/lib/types";
import { MOCK_INBOX_TASKS } from "@/lib/mock/tasks";

function atTime(daysFromToday: number, h: number, m = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function plus(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

const todayItems: PlanItem[] = [
  {
    id: "pi-1",
    title: "اجتماع مع الفريق",
    start_time: atTime(0, 14, 0),
    end_time: atTime(0, 15, 0),
    item_type: "existing_event",
    is_locked: true,
    reason: "موجود في تقويمك",
  },
  {
    id: "pi-2",
    title: "الجيم",
    start_time: atTime(0, 18, 30),
    end_time: atTime(0, 19, 30),
    item_type: "proposed_task",
    reason: "قلت «بعد الشغل» — افترضنا 6:30م",
  },
];

const tomorrowItems: PlanItem[] = [
  {
    id: "pi-3",
    title: "إنهاء العرض التقديمي",
    start_time: atTime(1, 10, 0),
    end_time: plus(atTime(1, 10, 0), 90),
    item_type: "proposed_task",
    reason: "قلت «بكرة» — حجزنا فترة طويلة وخالية",
  },
];

const thursdayDays = (() => {
  const today = new Date();
  const day = today.getDay(); // 0 sun ... 4 thu
  let diff = (4 - day + 7) % 7;
  if (diff === 0) diff = 7;
  return diff;
})();

const thursdayItems: PlanItem[] = [
  {
    id: "pi-4",
    title: "مكالمة العميل",
    start_time: atTime(thursdayDays, 16, 0),
    end_time: atTime(thursdayDays, 16, 30),
    item_type: "proposed_task",
    reason: "قلت «الخميس»",
  },
];

const buckets: DayBucket[] = [
  { date: "today", label: "today", arabicLabel: "اليوم", items: todayItems },
  { date: "tomorrow", label: "tomorrow", arabicLabel: "غداً", items: tomorrowItems },
  { date: "thursday", label: "later", arabicLabel: "الخميس", items: thursdayItems },
];

export const MOCK_PLAN: Plan = {
  id: "plan-mock-1",
  title: "خطتك المقترحة",
  status: "draft",
  ai_model: "mock",
  input_text:
    "عندي اجتماع 2، وعايز أروح الجيم بعد الشغل، وأخلص العرض بكرة، وأكلم العميل يوم الخميس، وراجع الفواتير لما أفضى",
  buckets,
  inbox: MOCK_INBOX_TASKS,
};

export function nextUpcomingItem(plan: Plan = MOCK_PLAN): PlanItem | null {
  const now = Date.now();
  const all = plan.buckets
    .flatMap((b) => b.items)
    .filter((i) => new Date(i.start_time).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  return all[0] ?? null;
}
