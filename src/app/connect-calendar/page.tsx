"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Loader2,
  Mail,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { AppShellMobile } from "@/components/shell/AppShellMobile";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PublicGoogleCalendarAccount {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  connectedAt: string;
}

interface AccountsResponse {
  configured: boolean;
  accounts: PublicGoogleCalendarAccount[];
}

interface StatusMessage {
  title: string;
  description: string;
  kind: "success" | "danger" | "default";
}

const STATUS_MESSAGES: Record<string, StatusMessage> = {
  connected: {
    title: "تم ربط التقويم",
    description: "سنقرأ أحداثك وتقويمات المناسبات من Google Calendar ونظهرها داخل التقويم.",
    kind: "success",
  },
  missing_google_config: {
    title: "Google Calendar غير مهيأ",
    description: "أضف مفاتيح Google OAuth في Vercel ثم أعد المحاولة.",
    kind: "danger",
  },
  missing_refresh_token: {
    title: "لم نحصل على صلاحية المتابعة",
    description: "أعد الربط واختر السماح الكامل حتى نقدر نحدث التقويم لاحقا.",
    kind: "danger",
  },
  invalid_google_state: {
    title: "انتهت جلسة الربط",
    description: "ابدأ الربط مرة أخرى من هذا الزر.",
    kind: "danger",
  },
  access_denied: {
    title: "تم إلغاء الربط",
    description: "لم نربط أي حساب لأن السماح لم يكتمل.",
    kind: "default",
  },
};

export default function ConnectCalendarPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [disconnectingId, setDisconnectingId] = React.useState<string | null>(null);
  const [data, setData] = React.useState<AccountsResponse>({
    configured: false,
    accounts: [],
  });
  const [message, setMessage] = React.useState<StatusMessage | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("calendar");
    if (status) {
      setMessage(
        STATUS_MESSAGES[status] ?? {
          title: "تعذر ربط التقويم",
          description: "راجع إعدادات Google OAuth ثم أعد المحاولة.",
          kind: "danger",
        }
      );
    }

    void loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoading(true);
    try {
      const response = await fetch("/api/google/accounts", { cache: "no-store" });
      const nextData = (await response.json()) as AccountsResponse;
      setData(nextData);
    } finally {
      setLoading(false);
    }
  }

  async function disconnect(accountId: string) {
    setDisconnectingId(accountId);
    try {
      const response = await fetch(
        `/api/google/accounts?accountId=${encodeURIComponent(accountId)}`,
        { method: "DELETE" }
      );
      const nextData = (await response.json()) as AccountsResponse;
      setData(nextData);
      setMessage({
        title: "تم فصل الحساب",
        description: "لن تظهر أحداث هذا الحساب في تقويم رتّبها.",
        kind: "default",
      });
    } finally {
      setDisconnectingId(null);
    }
  }

  const isConnected = data.accounts.length > 0;

  return (
    <AppShellMobile>
      <TopBar title="ربط التقويم" showBack />
      <div className="flex flex-col gap-4 px-4 py-6">
        {message && <StatusCard message={message} />}

        <Card className="border-primary-100 bg-primary-50/35">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100">
                <Calendar className="h-6 w-6 text-primary-700" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[19px] font-bold">اربط Google Calendar</h1>
                <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
                  اربط حساب أو أكثر، وسنجمع أحداثهم والمناسبات المختارة في التقويم اليومي والأسبوعي
                  والشهري داخل رتّبها.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-card border border-primary-100 bg-surface px-3 py-2 text-[12px] leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
              <span>
                نستخدم صلاحيات التقويم اللازمة لقراءة الأحداث والتقويمات المختارة وحفظ الخطة عندما تضغط حفظ.
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button asChild size="lg" disabled={!data.configured}>
                <a href="/api/google/oauth/start?returnTo=/connect-calendar">
                  <Plus className="h-4 w-4" />
                  {isConnected ? "إضافة حساب Google آخر" : "ربط حساب Google"}
                </a>
              </Button>
              {!data.configured && (
                <p className="text-center text-[12px] text-danger">
                  يلزم ضبط GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET على السيرفر.
                </p>
              )}
              <Button variant="outline" onClick={() => router.push("/calendar")}>
                عرض التقويم
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-0">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-bold">الحسابات المتصلة</h2>
                <p className="text-[12px] text-muted-foreground">
                  {isConnected
                    ? `${data.accounts.length} حساب متصل`
                    : "لا يوجد حساب متصل بعد"}
                </p>
              </div>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-primary-600" />}
            </div>
          </div>

          <div className="flex flex-col">
            {data.accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold">
                    {account.name ?? account.email}
                  </p>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {account.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="فصل الحساب"
                  disabled={disconnectingId === account.id}
                  onClick={() => disconnect(account.id)}
                >
                  {disconnectingId === account.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-danger" />
                  )}
                </Button>
              </div>
            ))}

            {!loading && !isConnected && (
              <div className="px-4 py-6 text-center text-[13px] leading-6 text-muted-foreground">
                أضف حسابك الأساسي الآن، وبعدها يمكنك إضافة حسابات أخرى بنفس الزر.
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShellMobile>
  );
}

function StatusCard({ message }: { message: StatusMessage }) {
  const isSuccess = message.kind === "success";
  const isDanger = message.kind === "danger";

  return (
    <Card
      className={
        isSuccess
          ? "border-primary-200 bg-primary-50"
          : isDanger
            ? "border-danger/30 bg-red-50"
            : "bg-muted/40"
      }
    >
      <div className="flex items-start gap-3">
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-700" />
        ) : (
          <AlertCircle
            className={
              isDanger
                ? "mt-0.5 h-5 w-5 shrink-0 text-danger"
                : "mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
            }
          />
        )}
        <div>
          <p className="text-[14px] font-bold">{message.title}</p>
          <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
            {message.description}
          </p>
        </div>
      </div>
    </Card>
  );
}
