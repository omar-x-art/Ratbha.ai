"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutGrid, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  matchExact?: boolean;
  activePrefixes?: string[];
  prominent?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/today",
    label: "اليوم",
    icon: <LayoutGrid className="h-5 w-5" />,
    matchExact: true,
  },
  {
    href: "/calendar",
    label: "التقويم",
    icon: <CalendarDays className="h-5 w-5" />,
  },
  {
    href: "/chat",
    label: "رتّب",
    icon: <Sparkles className="h-5 w-5" />,
    activePrefixes: ["/chat", "/plan"],
    prominent: true,
  },
  {
    href: "/settings",
    label: "الإعدادات",
    icon: <Settings className="h-5 w-5" />,
  },
];

interface BottomNavProps {
  className?: string;
}

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-[480px] items-center justify-around border-t border-border bg-background/95 backdrop-blur",
        "pb-[max(env(safe-area-inset-bottom),8px)] pt-2",
        className
      )}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.activePrefixes
          ? item.activePrefixes.some(
              (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
            )
          : item.matchExact
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors",
              isActive
                ? "text-primary-600"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                item.prominent && "h-10 w-10 bg-primary-500 text-white shadow-card",
                item.prominent && isActive && "bg-primary-600",
                !item.prominent && isActive && "bg-primary-100"
              )}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
