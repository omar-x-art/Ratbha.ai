"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { CalendarPermissionCard } from "@/components/system/CalendarPermissionCard";

export default function ConnectCalendarPage() {
  const router = useRouter();
  return (
    <AppShellMobile>
      <TopBar title="ربط التقويم" showBack />
      <div className="px-4 py-6">
        <CalendarPermissionCard
          onConnect={() => router.push("/")}
          onSkip={() => router.push("/")}
        />
      </div>
    </AppShellMobile>
  );
}
