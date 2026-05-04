"use client";

import * as React from "react";
import Link from "next/link";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { OnboardingHero } from "@/components/system/OnboardingHero";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  return (
    <AppShellMobile>
      <OnboardingHero />
      <div className="mt-auto flex flex-col gap-3 px-6 pb-10">
        <Button asChild size="xl">
          <Link href="/connect-calendar">ابدأ</Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link href="/">جرّبه أولاً</Link>
        </Button>
      </div>
    </AppShellMobile>
  );
}
