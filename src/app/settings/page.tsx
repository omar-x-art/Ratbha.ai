"use client";

import * as React from "react";
import {
  Bell,
  Calendar,
  Globe,
  LogOut,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { BottomNav } from "@/components/shell/BottomNav";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  return (
    <AppShellMobile withBottomNav>
      <TopBar title="الإعدادات" showBack />
      <div className="flex flex-col gap-3 px-4 py-4">
        <Card className="p-2">
          <Row icon={<User className="h-4 w-4" />} title="الحساب" desc="ربط Google" />
          <Separator />
          <Row
            icon={<Calendar className="h-4 w-4" />}
            title="التقويم"
            desc="Google Calendar"
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
            icon={<LogOut className="h-4 w-4" />}
            title="تسجيل الخروج"
          />
          <Separator />
          <Row
            icon={<Trash2 className="h-4 w-4" />}
            title="حذف الحساب"
            danger
          />
        </Card>
      </div>

      <BottomNav />
    </AppShellMobile>
  );
}
