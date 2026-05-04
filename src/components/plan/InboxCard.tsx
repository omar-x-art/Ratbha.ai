"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SuggestionChips, type Chip } from "@/components/chat/SuggestionChips";
import type { Task } from "@/lib/types";

interface InboxCardProps {
  task: Task;
  question?: string;
  options?: Chip[];
  onPick?: (chip: Chip) => void;
}

export function InboxCard({ task, question, options, onPick }: InboxCardProps) {
  return (
    <Card>
      <div className="mb-2 flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-secondary-600" />
        <span className="text-[13px] font-medium text-secondary-700">
          تحتاج توضيح
        </span>
      </div>
      <h4 className="text-[15px] font-semibold">{task.title}</h4>
      {question && (
        <p className="mt-1 text-[13px] text-muted-foreground">{question}</p>
      )}
      {options && options.length > 0 && (
        <div className="mt-3">
          <SuggestionChips chips={options} onPick={onPick} />
        </div>
      )}
    </Card>
  );
}
