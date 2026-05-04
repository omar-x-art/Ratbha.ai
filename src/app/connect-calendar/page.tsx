"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { usePlanStore } from "@/lib/store/plan-store";
import { DEMO_PLAN } from "@/lib/mock/demo-plan";

type Status = "idle" | "connecting" | "error";

export default function ConnectCalendarPage() {
  const router = useRouter();
  const { toast } = useToast();
  const setPlan = usePlanStore((s) => s.setPlan);
  const [status, setStatus] = React.useState<Status>("idle");

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      setStatus("error");
      toast({
        title: "فشل ربط Google Calendar",
        description: decodeURIComponent(err).slice(0, 120),
        variant: "danger",
      });
    }
  }, [toast]);

  function connect() {
    setStatus("connecting");
    window.location.href = "/api/auth/google/start";
  }

  function tryDemo() {
    setPlan(DEMO_PLAN);
    toast({
      title: "تم تحميل خطة تجريبية",
      description: "استكشف الواجهة بحرية، لا حفظ في تقويم حقيقي.",
      variant: "success",
    });
    router.push("/plan/preview");
  }

  return (
    <AppShellMobile>
      <TopBar title="ربط التقويم" showBack />
      <div className="flex flex-col gap-4 px-4 py-6">
        <Card>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
              <Calendar className="h-7 w-7 text-primary-700" />
            </div>
            <h2 className="text-[18px] font-semibold">اربط Google Calendar</h2>
            <p className="text-[14px] text-muted-foreground">
              نقرأ تقويمك لنعرف فراغاتك ونقترح خطة تناسب يومك.
            </p>
            <div className="flex items-center gap-2 rounded-card bg-muted px-3 py-2 text-[12px] text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary-600" />
              <span>لن نحفظ أي حدث في تقويمك إلا بعد ضغطك على زر «احفظ».</span>
            </div>

            <Button
              onClick={connect}
              size="lg"
              className="w-full"
              disabled={status === "connecting"}
            >
              {status === "connecting" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {status === "connecting"
                ? "جاري المحاولة..."
                : "ربط Google Calendar"}
            </Button>

            {status === "error" && (
              <p className="text-[12px] text-danger">
                لم نستطع إكمال الربط. حاول مرة أخرى.
              </p>
            )}
          </div>
        </Card>

        <Card className="border-secondary-100 bg-secondary-50/40">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-secondary-700" />
              <h3 className="text-[15px] font-semibold">جرّبه قبل الربط</h3>
            </div>
            <p className="text-[13px] text-muted-foreground">
              نحمّل لك خطة تجريبية فيها اجتماع، تقرير، جيم، ومكالمة. تستطيع
              تعديل أي مهمة لتفهم التجربة كاملة بدون أي إعدادات.
            </p>
            <Button
              onClick={tryDemo}
              variant="soft"
              size="md"
              className="self-start"
            >
              ابدأ الوضع التجريبي
            </Button>
          </div>
        </Card>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-[13px] text-muted-foreground underline-offset-4 hover:underline"
        >
          تخطّى الآن، أكتب مهامي مباشرة
        </button>
      </div>
    </AppShellMobile>
  );
}
