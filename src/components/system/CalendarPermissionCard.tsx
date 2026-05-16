"use client";

import * as React from "react";
import { Calendar, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CalendarPermissionCardProps {
  onConnect?: () => void;
  onSkip?: () => void;
}

export function CalendarPermissionCard({
  onConnect,
  onSkip,
}: CalendarPermissionCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
            <Calendar className="h-7 w-7 text-primary-700" />
          </div>
          <h2 className="text-[18px] font-semibold">اربط تقويم جوجل</h2>
          <p className="text-[14px] text-muted-foreground">
            نقرأ تقويمك لنعرف فراغاتك ونقترح خطة تناسب يومك.
          </p>
          <div className="flex items-center gap-2 rounded-card bg-muted px-3 py-2 text-[12px] text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary-600" />
            <span>لن نحفظ أي حدث في تقويمك إلا بعد ضغطك على زر «احفظ».</span>
          </div>
          <Button onClick={onConnect} size="lg" className="w-full">
            ربط تقويم جوجل
          </Button>
          <button
            type="button"
            onClick={onSkip}
            className="text-[13px] text-muted-foreground underline-offset-4 hover:underline"
          >
            تخطّى الآن، جرّبه أولاً
          </button>
        </div>
      </Card>
    </div>
  );
}
