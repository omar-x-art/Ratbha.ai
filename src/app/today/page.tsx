"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { NextTaskWidget } from "@/components/plan/NextTaskWidget";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { MOCK_PLAN, nextUpcomingItem } from "@/lib/mock/plans";
import { usePlanStore } from "@/lib/store/plan-store";
import type { PlanItem } from "@/lib/types";

function nextItemFromPlan(buckets: { items: PlanItem[] }[]): PlanItem | null {
  const now = Date.now();
  const all = buckets
    .flatMap((b) => b.items)
    .filter((i) => new Date(i.start_time).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  return all[0] ?? null;
}

export default function TodayPage() {
  const router = useRouter();
  const { toast } = useToast();
  const storedPlan = usePlanStore((s) => s.plan);
  const removeItem = usePlanStore((s) => s.removeItem);
  const postponeItem = usePlanStore((s) => s.postponeItem);

  const plan = storedPlan ?? MOCK_PLAN;
  const item = storedPlan
    ? nextItemFromPlan(storedPlan.buckets)
    : nextUpcomingItem(plan);

  function done() {
    if (item && storedPlan) removeItem(item.id);
    toast({ title: "أحسنت! تم إنجاز المهمة.", variant: "success" });
  }

  function postpone() {
    if (item && storedPlan) postponeItem(item.id);
    toast({
      title: "أجّلنا المهمة",
      description: "سنقترح لها وقتاً آخر لاحقاً.",
    });
  }

  return (
    <AppShellMobile>
      <TopBar title="يومي" showSettings />
      <div className="flex flex-col gap-4 px-4 pb-8 pt-4">
        <NextTaskWidget
          item={item}
          onDone={done}
          onPostpone={postpone}
          onReorganize={() => router.push("/plan/preview")}
        />

        <Button asChild size="lg" variant="soft" className="self-start">
          <Link href="/">
            <Plus className="h-4 w-4" />
            أضف مهام جديدة
          </Link>
        </Button>
      </div>
    </AppShellMobile>
  );
}
