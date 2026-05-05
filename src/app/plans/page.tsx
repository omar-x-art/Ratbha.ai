"use client";

import * as React from "react";
import Link from "next/link";
import { History, ChevronLeft } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/card";
import type { SavedPlanRow } from "@/lib/supabase/plans-list";

const ARABIC_DATE = new Intl.DateTimeFormat("ar-EG", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const ARABIC_DATETIME = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
});

export default function PlansHistoryPage() {
  const [plans, setPlans] = React.useState<SavedPlanRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [connected, setConnected] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/plans");
        const data = (await res.json()) as {
          connected: boolean;
          plans?: SavedPlanRow[];
        };
        if (cancelled) return;
        setConnected(data.connected);
        setPlans(data.plans ?? []);
      } catch {
        if (cancelled) return;
        setPlans([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShellMobile>
      <TopBar title="خططي السابقة" showSettings showBack />
      <div className="flex flex-col gap-3 px-4 pb-8 pt-4">
        {connected === false && (
          <Card className="text-[13px] text-muted-foreground">
            لم تربط حسابك بعد — لا يوجد سجلّ خطط محفوظة.{" "}
            <Link
              href="/connect-calendar"
              className="font-medium text-primary-700 underline-offset-2 hover:underline"
            >
              اربط الآن
            </Link>
          </Card>
        )}

        {loading && (
          <Card className="text-[13px] text-muted-foreground">
            جاري التحميل…
          </Card>
        )}

        {!loading && connected !== false && plans.length === 0 && (
          <Card className="flex flex-col items-center gap-2 py-6 text-center">
            <History className="h-6 w-6 text-muted-foreground" />
            <span className="text-[15px] font-semibold">لا توجد خطط محفوظة بعد</span>
            <span className="text-[12px] text-muted-foreground">
              بعد ما تحفظ أول خطة في تقويمك، رح تظهر هنا.
            </span>
            <Link
              href="/"
              className="mt-1 text-[13px] font-medium text-primary-700 underline-offset-2 hover:underline"
            >
              ابدأ بكتابة خطتك
            </Link>
          </Card>
        )}

        {plans.map((p) => (
          <Link
            key={p.id}
            href={`/plans/${p.id}`}
            className="group block rounded-card border border-border bg-surface p-3 shadow-card transition-colors hover:bg-muted/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold leading-snug">
                    {p.title || "خطة"}
                  </span>
                  {p.status && (
                    <span className="rounded-chip bg-primary-50 px-2 py-0.5 text-[10px] text-primary-700">
                      {p.status === "saved" ? "محفوظة" : p.status}
                    </span>
                  )}
                </div>
                <span className="text-[12px] text-muted-foreground">
                  {p.plan_date
                    ? ARABIC_DATE.format(new Date(`${p.plan_date}T00:00:00`))
                    : ARABIC_DATETIME.format(new Date(p.created_at))}
                </span>
                <span className="text-[12px] text-muted-foreground/80">
                  {p.item_count} عنصر
                </span>
                {p.input_text && (
                  <span className="line-clamp-2 text-[12px] text-muted-foreground/70">
                    «{p.input_text}»
                  </span>
                )}
              </div>
              <ChevronLeft className="mt-1 h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </AppShellMobile>
  );
}
