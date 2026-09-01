import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LogOut,
  ShieldCheck,
  Smartphone,
  Bell,
  BadgeCheck,
  Store,
  PlusCircle,
  FileSearch,
  ShieldAlert,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getCurrentUser, getUnreadNotificationCount } from "@/lib/supabase/queries";
import { signOutAction } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "حسابي | سندك",
};

const roleLabels: Record<string, string> = {
  user: "مستخدم",
  developer: "مطور",
  admin: "مشرف",
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const displayName = user.fullName || user.email || "مستخدم سندك";
  const unreadCount = await getUnreadNotificationCount(user.id);

  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto max-w-md">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-extrabold text-white">
            {displayName.charAt(0)}
          </span>
          <div>
            <p className="text-lg font-extrabold text-navy">{displayName}</p>
            {user.email && <p className="mt-0.5 text-sm text-slate-500">{user.email}</p>}
          </div>
          <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark">
            {roleLabels[user.role] ?? user.role}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <Link
            href="/devices"
            className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-navy shadow-sm transition-colors hover:bg-slate-50"
          >
            <Smartphone className="h-4 w-4" />
            أجهزتي
          </Link>

          <Link
            href="/devices/new"
            className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-navy shadow-sm transition-colors hover:bg-slate-50"
          >
            <PlusCircle className="h-4 w-4" />
            تسجيل جهاز
          </Link>

          <Link
            href="/devices/claims"
            className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-navy shadow-sm transition-colors hover:bg-slate-50"
          >
            <FileSearch className="h-4 w-4" />
            مطالباتي
          </Link>

          <Link
            href="/devices/reports"
            className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-navy shadow-sm transition-colors hover:bg-slate-50"
          >
            <ShieldAlert className="h-4 w-4" />
            بلاغاتي
          </Link>

          <Link
            href="/devices/certificates"
            className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-navy shadow-sm transition-colors hover:bg-slate-50"
          >
            <BadgeCheck className="h-4 w-4" />
            شهاداتي
          </Link>

          <Link
            href="/account/notifications"
            className="flex h-12 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-navy shadow-sm transition-colors hover:bg-slate-50"
          >
            <span className="flex items-center gap-3">
              <Bell className="h-4 w-4" />
              الإشعارات
            </span>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Link>

          {user.isDealer && (
            <Link
              href="/dealer"
              className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-navy shadow-sm transition-colors hover:bg-slate-50"
            >
              <Store className="h-4 w-4" />
              لوحة التاجر
            </Link>
          )}

          {user.role === "admin" && (
            <Link
              href="/admin"
              className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-navy shadow-sm transition-colors hover:bg-slate-50"
            >
              <ShieldCheck className="h-4 w-4" />
              لوحة الإدارة
            </Link>
          )}

          <form action={signOutAction}>
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy text-sm font-bold text-white transition-colors hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </button>
          </form>
        </div>
      </div>
    </Container>
  );
}
