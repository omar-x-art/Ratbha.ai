import * as React from "react";
import { cn } from "@/lib/utils";

type ChatThreadProps = React.HTMLAttributes<HTMLDivElement>;

export function ChatThread({ className, children, ...props }: ChatThreadProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-4 px-4 pb-6 pt-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
