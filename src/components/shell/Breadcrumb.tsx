"use client";

import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: Crumb[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="مسار التنقل"
      className={cn("flex items-center gap-1 text-[12px]", className)}
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && (
            <ChevronLeft className="h-3 w-3 text-muted-foreground" />
          )}
          {item.href ? (
            <a
              href={item.href}
              className="text-primary-700 hover:underline"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-muted-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
