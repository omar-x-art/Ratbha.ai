import * as React from "react";
import { cn } from "@/lib/utils";

interface DaySectionProps extends React.HTMLAttributes<HTMLElement> {
  label: string;
}

export function DaySection({
  label,
  className,
  children,
  ...props
}: DaySectionProps) {
  return (
    <section className={cn("flex flex-col gap-2", className)} {...props}>
      <h3 className="px-1 text-[13px] font-semibold text-muted-foreground">
        {label}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
