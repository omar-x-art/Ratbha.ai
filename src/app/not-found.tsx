import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <AppShellMobile>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="relative h-32 w-32 overflow-hidden rounded-full bg-primary-50 ring-4 ring-primary-100">
          <Image
            src="/characters/siraj-base.png"
            alt="سراج"
            width={300}
            height={300}
            className="h-full w-full object-cover"
          />
        </div>
        <h1 className="text-[20px] font-semibold">ضعت يا سراج؟</h1>
        <p className="text-[14px] text-muted-foreground">
          الصفحة اللي تبيها غير موجودة. خلّني أرجعك للبداية.
        </p>
        <Button asChild size="lg">
          <Link href="/">للشاشة الرئيسية</Link>
        </Button>
      </div>
    </AppShellMobile>
  );
}
