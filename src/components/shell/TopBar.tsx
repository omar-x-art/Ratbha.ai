"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title?: React.ReactNode;
  showBack?: boolean;
  showSettings?: boolean;
  rightSlot?: React.ReactNode;
  className?: string;
}

export function TopBar({
  title,
  showBack = false,
  showSettings = false,
  rightSlot,
  className,
}: TopBarProps) {
  const router = useRouter();
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-2 backdrop-blur",
        className
      )}
    >
      <div className="flex items-center gap-1">
        {showBack ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="رجوع"
            onClick={() => router.back()}
          >
            {/* In RTL, "back" visually points right */}
            <ChevronRight className="h-5 w-5" />
          </Button>
        ) : (
          <span className="ms-2 inline-block text-[15px] font-bold text-primary-700">
            رتّبها
          </span>
        )}
      </div>
      <div className="text-[15px] font-semibold">{title}</div>
      <div className="flex items-center gap-1">
        {rightSlot}
        {showSettings && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="إعدادات"
            asChild
          >
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
