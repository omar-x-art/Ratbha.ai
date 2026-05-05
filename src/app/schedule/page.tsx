"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, ExternalLink, RefreshCw } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/button";
import { DaySection } from "@/components/plan/DaySection";
import { ReassureBar } from "@/components/chat/ReassureBar";
import { WeekGrid, type GridEvent } from "@/components/schedule/WeekGrid";
import { MonthGrid } from "@/components/schedule/MonthGrid";
import { useGoogleSession } from "@/lib/hooks/use-google-session";

type Tab = "day" | "week" | "month";

const TABS: { id: Tab; label: string }[] = [
  { id: "day", label: "اليوم" },
  { id: "week", label: "الأسبوع" },
  { id: "month", label: "الشهر" },
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

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function googleCalendarSearchUrl(title: string): string {
  return `https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(title)}`;
}

export default function SchedulePage() {
  const session = useGoogleSession();
  const [tab, setTab] = React.useState<Tab>("week");
  const [refDate, setRefDate] = React.useState<Date>(() => startOfDay(new Date()));
  const [events, setEvents] = React.useState<GridEvent[]>([]);
  const [connected, setConnected] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // For each tab, request enough days to cover the visible window relative
  // to today (range API only supports `days` from now, so we always fetch
  // a generous window and filter client-side).
  const fetchEvents = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar/events?days=62`);
      const data = (await res.json()) as {
        connected: boolean;
        events?: GridEvent[];
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
    void fetchEvents();
  }, [fetchEvents]);

  // Day-tab specific: events on refDate
  const dayEvents = React.useMemo(() => {
    const key = ymd(refDate);
    return events
      .filter((ev) => ymd(new Date(ev.start)) === key)
      .sort(
        (a, b) =>
          new Date(a.start).getTime() - new Date(b.start).getTime()
      );
  }, [events, refDate]);

  function shiftRefDate(deltaDays: number) {
    const d = new Date(refDate);
    d.setDate(d.getDate() + deltaDays);
    setRefDate(d);
  }

  function shiftRefMonth(deltaMonths: number) {
    const d = new Date(refDate);
    d.setMonth(d.getMonth() + deltaMonths);
    setRefDate(d);
  }

  function jumpToToday() {
    setRefDate(startOfDay(new Date()));
  }

  function handleDayClick(d: Date) {
    setRefDate(startOfDay(d));
    setTab("day");
  }

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

        <NavBar
          tab={tab}
          refDate={refDate}
          onPrev={() => (tab === "month" ? shiftRefMonth(-1) : shiftRefDate(tab === "week" ? -7 : -1))}
          onNext={() => (tab === "month" ? shiftRefMonth(1) : shiftRefDate(tab === "week" ? 7 : 1))}
          onToday={jumpToToday}
        />

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

        {tab === "day" && (
          <div className="flex flex-col gap-3">
            {!loading && dayEvents.length === 0 && (
              <div className="rounded-card border border-border bg-surface p-6 text-center text-[13px] text-muted-foreground">
                لا توجد أحداث في هذا اليوم.
              </div>
            )}
            {dayEvents.length > 0 && (
              <DaySection label={ARABIC_DAY.format(refDate)}>
                {dayEvents.map((ev) => (
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
            )}
          </div>
        )}

        {tab === "week" && (
          <WeekGrid
            events={events}
            referenceDate={refDate}
            onEventClick={(ev) => {
              window.open(googleCalendarSearchUrl(ev.title), "_blank");
            }}
            onDayClick={handleDayClick}
          />
        )}

        {tab === "month" && (
          <MonthGrid
            events={events}
            referenceDate={refDate}
            onDayClick={handleDayClick}
          />
        )}

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
            onClick={() => void fetchEvents()}
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

function NavBar({
  tab,
  refDate,
  onPrev,
  onNext,
  onToday,
}: {
  tab: Tab;
  refDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const label =
    tab === "day"
      ? ARABIC_DAY.format(refDate)
      : tab === "week"
        ? `أسبوع ${refDate.getDate()} ${new Intl.DateTimeFormat("ar-EG", { month: "long" }).format(refDate)}`
        : new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric" }).format(refDate);

  return (
    <div className="flex items-center justify-between gap-2 rounded-card border border-border bg-surface px-2 py-1.5 shadow-card">
      <button
        type="button"
        onClick={onPrev}
        aria-label="السابق"
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onToday}
        className="flex flex-1 flex-col items-center text-[13px] font-semibold hover:underline"
      >
        {label}
        <span className="text-[10px] font-normal text-muted-foreground">
          اضغط للعودة لليوم
        </span>
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="التالي"
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
