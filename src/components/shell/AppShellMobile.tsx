import * as React from "react";
import { cn } from "@/lib/utils";

interface AppShellMobileProps extends React.HTMLAttributes<HTMLDivElement> {
  withComposerSpace?: boolean;
}

export function AppShellMobile({
  className,
  children,
  withComposerSpace = false,
  ...props
}: AppShellMobileProps) {
  return (
    <div className={cn("app-shell", className)} {...props}>
      <main className={cn("app-main", withComposerSpace && "pb-32")}>
        {children}
      </main>
    </div>
  );
}
