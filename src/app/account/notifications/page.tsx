import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bell, BellOff } from "lucide-react";
import { getCurrentUser, getMyNotifications } from "@/lib/supabase/queries";
import { Container } from "@/components/ui/Container";
import { markNotificationReadAction } from "./actions";
import { formatDateTime, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "الإشعارات | سندك",
  robots: { index: false },
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const notifications = await getMyNotifications(user.id);

  return (
    <Container className="py-8 sm:py-12">
      <Link
        href="/account"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy"
      >
        <ArrowRight className="h-4 w-4" />
        حسابي
      </Link>

      <h1 className="mb-5 text-xl font-extrabold text-navy">الإشعارات</h1>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <BellOff className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">لا توجد إشعارات بعد.</p>
        </div>
      ) : (
        <div className="mx-auto max-w-lg space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4 shadow-sm",
                n.readAt ? "border-slate-200 bg-white" : "border-primary/30 bg-primary-light/30"
              )}
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary-dark">
                <Bell className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy">{n.title}</p>
                {n.body && <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>}
                <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.readAt && (
                <form action={markNotificationReadAction.bind(null, n.id)}>
                  <button type="submit" className="shrink-0 text-[11px] font-semibold text-primary hover:underline">
                    تعليم كمقروء
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
