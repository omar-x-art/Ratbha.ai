"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const startY = React.useRef(0);
  const isPulling = React.useRef(false);

  function handleTouchStart(e: React.TouchEvent) {
    const scrollTop =
      (e.currentTarget as HTMLElement).scrollTop ?? 0;
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isPulling.current || isRefreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
    }
  }

  async function handleTouchEnd() {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  }

  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div
      className={cn("relative flex flex-1 flex-col overflow-y-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden transition-all duration-200",
          showIndicator ? "h-10 opacity-100" : "h-0 opacity-0"
        )}
      >
        <RefreshCw
          className={cn(
            "h-5 w-5 text-primary-500",
            isRefreshing && "animate-spin"
          )}
        />
        <span className="ms-2 text-[12px] text-muted-foreground">
          {isRefreshing ? "جاري التحديث..." : "اسحب للتحديث"}
        </span>
      </div>
      {children}
    </div>
  );
}
