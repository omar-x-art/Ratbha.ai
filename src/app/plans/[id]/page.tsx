"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/card";
import { DaySection } from "@/components/plan/DaySection";
import type {
  SavedPlanItemRow,
  SavedPlanRow,
} from "@/lib/supabase/plans-list";

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

export default function PlanSnapshotPage() {
  const params = useParams<{ id: string }>();
  const [plan, setPlan] = React.useState<SavedPlanRow | null>(null);
  const [items, setItems] = React.useState<SavedPlanItemRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [connected, setConnected] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/plans/${params.id}`);
        const data = (await res.json()) as {
          connected: boolean;
          plan: SavedPlanRow | null;
          items: SavedPlanItemRow[];
        };
        if (cancelled) return;
        setConnected(data.connected);
        setPlan(data.plan);
        setItems(data.items ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, SavedPlanItemRow[]>();
    for (const it of items) {
      const key = ymd(new Date(it.start_time));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    for (const list of Array.from(map.values())) {
      list.sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    }
    return map;
  }, [items]);

  const sortedDays = React.useMemo(
    () => Array.from(grouped.keys()).sort(),
    [grouped]
  );

  return (
    <AppShellMobile>
      <TopBar title={plan?.title ?? "خطة"} showSettings showBack />
      <div className="flex flex-col gap-3 px-4 pb-8 pt-4">
        {loading && (
          <Card className="text-[13px] text-muted-foreground">
            جاري التحميل…
          </Card>
        )}

        {!loading && !plan && (
          <Card className="text-[13px] text-muted-foreground">
            لم يتم العثور على هذه الخطة.{" "}
            <Link
              href="/plans"
              className="font-medium text-primary-700 underline-offset-2 hover:underline"
            >
              ارجع للقائمة
            </Link>
          </Card>
        )}

        {plan && plan.input_text && (
          <Card className="text-[12px] text-muted-foreground/80">
            «{plan.input_text}»
          </Card>
        )}

        {sortedDays.map((key) => {
          const list = grouped.get(key) ?? [];
          const dayDate = new Date(`${key}T00:00:00`);
          return (
            <DaySection key={key} label={ARABIC_DAY.format(dayDate)}>
              {list.map((it) => (
                <div
                  key={it.id}
                  className="flex items-start justify-between gap-3 rounded-card border border-border bg-surface p-3 shadow-card"
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-[15px] font-semibold leading-snug">
                      {it.title}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      {ARABIC_TIME.format(new Date(it.start_time))}
                      {" — "}
                      {ARABIC_TIME.format(new Date(it.end_time))}
                    </span>
                    {it.reason && (
                      <span className="text-[12px] text-muted-foreground/80">
                        {it.reason}
                      </span>
                    )}
                  </div>
                  {it.google_event_id && (
                    <a
                      href={`https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(it.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="افتح في Google Calendar"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </DaySection>
          );
        })}

        {connected !== false && plan && items.length === 0 && (
          <Card className="text-[13px] text-muted-foreground">
            لا توجد عناصر في هذه الخطة.
          </Card>
        )}
      </div>
    </AppShellMobile>
  );
}
