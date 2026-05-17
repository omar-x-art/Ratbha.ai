"use client";

import * as React from "react";
import { Pencil, Pin, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { PlanItem } from "@/lib/types";

interface TaskActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PlanItem | null;
  onEdit?: (item: PlanItem) => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string) => void;
}

export function TaskActionsSheet({
  open,
  onOpenChange,
  item,
  onEdit,
  onDelete,
  onPin,
}: TaskActionsSheetProps) {
  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="text-start">{item.title}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 pb-2">
          {onEdit && (
            <ActionButton
              icon={<Pencil className="h-4 w-4" />}
              label="تعديل المهمة"
              onClick={() => {
                onEdit(item);
                onOpenChange(false);
              }}
            />
          )}
          {onPin && (
            <ActionButton
              icon={<Pin className="h-4 w-4" />}
              label="تثبيت"
              onClick={() => {
                onPin(item.id);
                onOpenChange(false);
              }}
            />
          )}
          {onDelete && (
            <ActionButton
              icon={<Trash2 className="h-4 w-4" />}
              label="حذف"
              danger
              onClick={() => {
                onDelete(item.id);
                onOpenChange(false);
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ActionButton({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-card px-3 py-3 text-start text-[15px] font-medium transition-colors hover:bg-muted ${
        danger ? "text-danger" : "text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
