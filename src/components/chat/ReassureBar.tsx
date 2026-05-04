import * as React from "react";
import { cn } from "@/lib/utils";

type ReassureBarProps = React.HTMLAttributes<HTMLDivElement>;

export function ReassureBar({
  className,
  children,
  ...props
}: ReassureBarProps) {
  return (
    <div className={cn("reassure-text", className)} {...props}>
      {children}
    </div>
  );
}
