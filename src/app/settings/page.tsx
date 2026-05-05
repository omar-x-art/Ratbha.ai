"use client";

import * as React from "react";
import {
  Bell,
  Calendar,
  CalendarRange,
  Download,
  Globe,
  History,
  LogOut,
  RotateCcw,
  Sparkles,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { usePlanStore } from "@/lib/store/plan-store";
import { DEMO_PLAN } from "@/lib/mock/demo-plan";
import { useGoogleSession } from "@/lib/hooks/use-google-session";
import { useInstallPrompt } from "@/lib/hooks/use-install-prompt";

interface RowProps {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  danger?: boolean;
  onClick?: () => void;
}

function Row({ icon, title, desc, danger, onClick }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-card px-2 py-3 text-start hover:bg-muted"
    >
      <span
        className={
          danger
            ? "flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-danger"
            : "flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700"
        }
      >
        {icon}
      </span>
      <span className="flex flex-1 flex-col">
        <span
          className={
            danger
              ? "text-[15px] font-semibold text-danger"
              : "text-[15px] font-semibold"
          }
        >
          {title}
        </span>
        {desc && (
          <span className="text-[12px] text-muted-foreground">{desc}</span>
        )}
      </span>
    </button>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const setPlan = usePlanStore((s) => s.setPlan);
  const reset = usePlanStore((s) => s.reset);
  const session = useGoogleSession();
  const install = useInstallPrompt();

  async function tryInstall() {
    const outcome = await install.prompt();
    if (outcome === "accepted") {
      toast({ title: "تم تثبيت التطبيق", variant: "success" });
    } else if (outcome === "unavailable") {
      toast({
        title: "التثبيت غير متاح حالياً",
        description: "افتح التطبيق على Chrome أو Edge من جوال Android.",
      });
    }
  }

  function loadDemo() {
    setPlan(DEMO_PLAN);
    toast({
      title: "تم تحميل الخطة التجريبية",
      variant: "success",
    });
  }

  function clearPlan() {
    reset();
    toast({ title: "أُفرغت الخطة الحالية" });
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/connect-calendar";
    } catch {
      toast({ title: "خطأ في الخروج", variant: "danger" });
    }
  }

  return (
    <AppShellMobile>
      <TopBar title="الإعدادات" showBack />
      <div className="flex flex-col gap-3 px-4 py-4">
        <Card className="p-2">
          <Row
            icon={<User className="h-4 w-4" />}
            title={session?.email ?? "الحساب"}
            desc={session?.connected ? session.name ?? "متصل بـ Google" : "غير متصل"}
          />
          <Separator />
          <Row
            icon={<Calendar className="h-4 w-4" />}
            title="التقويم"
            desc={
              session?.connected ? "Google Calendar متصل" : "اضغط لربط التقويم"
            }
            onClick={() =>
              (window.location.href = session?.connected
                ? "/settings"
                : "/connect-calendar")
            }
          />
          <Separator />
          <Row
            icon={<Bell className="h-4 w-4" />}
            title="الإشعارات"
            desc="تذكيرات قبل المهام"
          />
        </Card>

        <Card className="p-2">
          <Row
            icon={<CalendarRange className="h-4 w-4" />}
            title="جدولي الكامل"
            desc="اليوم / الأسبوع / الشهر"
            onClick={() => (window.location.href = "/schedule")}
          />
          <Separator />
          <Row
            icon={<History className="h-4 w-4" />}
            title="خططي السابقة"
            desc="عرض سجل الخطط المحفوظة"
            onClick={() => (window.location.href = "/plans")}
          />
        </Card>

        <Card className="p-2">
          <Row
            icon={<Globe className="h-4 w-4" />}
            title="اللغة"
            desc="العربية"
          />
          <Separator />
          <Row
            icon={<Users className="h-4 w-4" />}
            title="الشخصيات"
            desc="سراج وعمر"
          />
        </Card>

        <Card className="p-2">
          <Row
            icon={<Download className="h-4 w-4" />}
            title={install.installed ? "التطبيق مثبّت" : "ثبّت التطبيق"}
            desc={
              install.installed
                ? "يفتح من شاشتك الرئيسية بدون متصفح"
                : install.available
                  ? "أضِف رتّبها للشاشة الرئيسية"
                  : "افتح من Chrome على Android لإظهار خيار التثبيت"
            }
            onClick={install.available ? tryInstall : undefined}
          />
          <Separator />
          <Row
            icon={<Sparkles className="h-4 w-4" />}
            title="حمّل خطة تجريبية"
            desc="استكشف التجربة بدون كتابة أي مهام"
            onClick={loadDemo}
          />
          <Separator />
          <Row
            icon={<RotateCcw className="h-4 w-4" />}
            title="أفرغ الخطة الحالية"
            desc="ابدأ من الصفر"
            onClick={clearPlan}
          />
        </Card>

        <Card className="p-2">
          <Row
            icon={<LogOut className="h-4 w-4" />}
            title="تسجيل الخروج"
            onClick={logout}
          />
          <Separator />
          <Row
            icon={<Trash2 className="h-4 w-4" />}
            title="حذف الحساب"
            danger
          />
        </Card>
      </div>
    </AppShellMobile>
  );
}
