import * as React from "react";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CharacterAvatar } from "@/components/characters/CharacterAvatar";

interface PlanSummaryCardProps {
  totalToday: number;
  totalLater: number;
  reasonText?: string;
}

export function PlanSummaryCard({
  totalToday,
  totalLater,
  reasonText = "اقترحت لك هذه الخطة بناءً على ما كتبته.",
}: PlanSummaryCardProps) {
  return (
    <Card className="bg-primary-50/60 border-primary-100">
      <div className="flex items-start gap-3">
        <CharacterAvatar who="omar" state="explaining" size={40} />
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-1 text-[13px] font-semibold text-primary-700">
            <Sparkles className="h-4 w-4" />
            <span>اقترحت لك هذه الخطة</span>
          </div>
          <p className="text-[14px] text-foreground">{reasonText}</p>
          <div className="mt-3 flex gap-4 text-[12px] text-muted-foreground">
            <span>
              اليوم: <strong className="text-foreground">{totalToday}</strong>
            </span>
            <span>
              لاحقاً: <strong className="text-foreground">{totalLater}</strong>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
