"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, ExternalLink, RefreshCw } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/button";
import { DaySection } from "@/components/plan/DaySection";
import { ReassureBar } from "@/components/chat/ReassureBar";
import { useGoogleSession } from "@/lib/hooks/use-google-session";

interface ScheduleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isMeeting?: boolean;
}

type Tab = "day" | "week" | "month";

const TABS: { id: Tab; label: string; days: number }[] = [
  { id: "day", label: "اليوم", days: 1 },
  { id: "week", label: "الأسبوع", days: 7 },
  { id: "month", label: "الشهر", days: 31 },
];

const ARABIC_DAY = new Intl.DateTimeFormat("ar-EG", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const ARABIC_TIME = new Intl.DateTimeFormat("ar-EG", {
  hour: "numeric",
  minute: "2-digit",
});

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function groupByDay(events: ScheduleEvent[]): Map<string, ScheduleEvent[]> {
  const out = new Map<string, ScheduleEvent[]>();
  for (const ev of events) {
    const key = ymd(new Date(ev.start));
    if (!out.has(key)) out.set(key, []);
    out.get(key)!.push(ev);
  }
  for (const list of Array.from(out.values())) {
    list.sort(
      (a, b) =>
        new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }
  return out;
}

function googleCalendarSearchUrl(title: string): string {
  return `https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(title)}`;
}

export default function SchedulePage() {
  const session = useGoogleSession();
  const [tab, setTab] = React.useState<Tab>("week");
  const [events, setEvents] = React.useState<ScheduleEvent[]>([]);
  const [connected, setConnected] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchEvents = React.useCallback(async (days: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar/events?days=${days}`);
      const data = (await res.json()) as {
        connected: boolean;
        events?: ScheduleEvent[];
      };
      setConnected(data.connected);
      setEvents(data.events ?? []);
    } catch (err) {
      setError(String(err).slice(0, 200));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const days = TABS.find((t) => t.id === tab)?.days ?? 7;
    void fetchEvents(days);
  }, [tab, fetchEvents]);

  const grouped = React.useMemo(() => groupByDay(events), [events]);
  const sortedDays = React.useMemo(
    () => Array.from(grouped.keys()).sort(),
    [grouped]
  );

  return (
    <AppShellMobile>
      <TopBar title="جدولي" showSettings showBack />
      <div className="flex flex-col gap-4 px-4 pb-8 pt-4">
        <div
          role="tablist"
          aria-label="نطاق الجدول"
          className="flex gap-2 rounded-chip border border-border bg-surface p-1 shadow-card"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                "flex-1 rounded-chip px-3 py-2 text-[13px] font-medium transition-colors " +
                (tab === t.id
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {connected === false && (
          <div className="rounded-card border border-border bg-surface p-4 text-[13px] text-muted-foreground">
            لم تربط Google Calendar بعد — هذه عرض تجريبي.{" "}
            <Link
              href="/connect-calendar"
              className="font-medium text-primary-700 underline-offset-2 hover:underline"
            >
              اربط الآن
            </Link>
          </div>
        )}

        {error && (
          <div className="rounded-card border border-danger/30 bg-red-50 p-4 text-[13px] text-danger">
            تعذّر جلب الأحداث الآن. {error}
          </div>
        )}

        {loading && (
          <div className="rounded-card border border-border bg-surface p-4 text-[13px] text-muted-foreground">
            جاري التحميل…
          </div>
        )}

        {!loading && events.length === 0 && (
          <div className="rounded-card border border-border bg-surface p-6 text-center text-[13px] text-muted-foreground">
            لا توجد أحداث في هذا النطاق.
          </div>
        )}

        {sortedDays.map((key) => {
          const list = grouped.get(key) ?? [];
          const dayDate = new Date(`${key}T00:00:00`);
          return (
            <DaySection key={key} label={ARABIC_DAY.format(dayDate)}>
              {list.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start justify-between gap-3 rounded-card border border-border bg-surface p-3 shadow-card"
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-[15px] font-semibold leading-snug">
                      {ev.title}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      {ARABIC_TIME.format(new Date(ev.start))}
                      {" — "}
                      {ARABIC_TIME.format(new Date(ev.end))}
                    </span>
                    {ev.isMeeting && (
                      <span className="text-[12px] text-muted-foreground/80">
                        اجتماع
                      </span>
                    )}
                  </div>
                  <a
                    href={googleCalendarSearchUrl(ev.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="افتح في Google Calendar"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </DaySection>
          );
        })}

        <div className="mt-2 flex flex-col gap-2">
          <Button asChild size="lg" variant="outline">
            <a
              href="https://calendar.google.com/calendar/u/0/r"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Calendar className="h-4 w-4" />
              افتح Google Calendar للتعديل الكامل
            </a>
          </Button>
          <Button
            variant="soft"
            size="md"
            onClick={() => {
              const days = TABS.find((t) => t.id === tab)?.days ?? 7;
              void fetchEvents(days);
            }}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>

        {session?.connected && (
          <ReassureBar className="mt-2 text-center">
            متصل بـ {session.email}
          </ReassureBar>
        )}
      </div>
    </AppShellMobile>
  );
}
