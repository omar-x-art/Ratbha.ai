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

export default function TodayPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [item, setItem] = React.useState(() => nextUpcomingItem(MOCK_PLAN));

  function done() {
    toast({ title: "أحسنت! تم إنجاز المهمة.", variant: "success" });
    setItem(null);
  }

  function postpone() {
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
