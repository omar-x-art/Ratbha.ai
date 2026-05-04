"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageSquare, Pencil, Save } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { OnboardingHero } from "@/components/system/OnboardingHero";
import { Button } from "@/components/ui/button";

interface Step {
  icon: React.ReactNode;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: <MessageSquare className="h-5 w-5 text-primary-700" />,
    title: "اكتب اللي في دماغك",
    body: "بدون قوائم، بدون تصنيفات. جملة واحدة بالعامية تكفي.",
  },
  {
    icon: <Pencil className="h-5 w-5 text-secondary-700" />,
    title: "أرتّب لك خطة",
    body: "أفهم «بكرة» و«الخميس» وأقترح أوقاتاً تناسب طاقتك.",
  },
  {
    icon: <Save className="h-5 w-5 text-primary-700" />,
    title: "أنت تقرّر الحفظ",
    body: "لن أحفظ شيئاً في Google Calendar قبل مراجعتك.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      router.push("/connect-calendar");
    }
  }

  return (
    <AppShellMobile>
      {step === 0 ? (
        <OnboardingHero />
      ) : (
        <div className="flex flex-col items-center gap-4 px-6 pb-6 pt-10 text-center">
          <div className="relative h-28 w-28 overflow-hidden rounded-full bg-secondary-50 ring-4 ring-secondary-100">
            <Image
              src={
                step === 1
                  ? "/characters/siraj-base.png"
                  : "/characters/omar-base.png"
              }
              alt={step === 1 ? "سراج" : "عمر"}
              width={300}
              height={300}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 px-6 pb-2 pt-2">
        <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50">
            {STEPS[step].icon}
          </div>
          <div className="flex flex-col">
            <h2 className="text-[16px] font-semibold">{STEPS[step].title}</h2>
            <p className="text-[13px] text-muted-foreground">
              {STEPS[step].body}
            </p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={
                "h-2 rounded-full transition-all " +
                (i === step
                  ? "w-6 bg-primary-600"
                  : "w-2 bg-muted-foreground/30")
              }
            />
          ))}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2 px-6 pb-10">
        <Button onClick={next} size="xl">
          {step === STEPS.length - 1 ? "هيا نبدأ" : "التالي"}
          <ArrowRight className="h-4 w-4 rotate-180" />
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link href="/">تخطّى</Link>
        </Button>
      </div>
    </AppShellMobile>
  );
}
