import * as React from "react";
import Image from "next/image";

export function OnboardingHero() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 pb-6 pt-12 text-center">
      <div className="relative h-44 w-44 overflow-hidden rounded-full bg-primary-50 ring-4 ring-primary-100">
        <Image
          src="/characters/siraj-base.png"
          alt="سراج"
          width={400}
          height={400}
          className="h-full w-full object-cover"
          priority
        />
      </div>
      <h1 className="text-[26px] font-bold leading-tight">
        أهلاً، أنا <span className="text-primary-700">سراج</span>
      </h1>
      <p className="max-w-[300px] text-[15px] leading-relaxed text-muted-foreground">
        اكتب اللي في دماغك… وسأرتّبه داخل تقويمك.
        <br />
        لن نحفظ شيئاً قبل مراجعتك.
      </p>
    </div>
  );
}
