import Link from "next/link";
import { AlertTriangle, Calendar, LayoutGrid } from "lucide-react";
import type { DeveloperSubscription } from "@/lib/supabase/queries";
import { displayStateInfo, planLabels, daysUntil } from "@/lib/subscription";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function SubscriptionStatusCard({
  subscription,
  compact,
}: {
  subscription: DeveloperSubscription;
  compact?: boolean;
}) {
  const info = displayStateInfo[subscription.displayState];
  const remaining = daysUntil(subscription.expiresAt);
  const limitLabel =
    subscription.maxApps === null ? "غير محدود" : `${subscription.appCount} / ${subscription.maxApps}`;

  const showExpiryWarning =
    (subscription.status === "trial" || subscription.status === "active") &&
    remaining !== null &&
    remaining <= 30 &&
    remaining >= 0;
  const showExpiredWarning = subscription.status === "expired";
  const atLimit =
    subscription.maxApps !== null && subscription.appCount >= subscription.maxApps;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", info.className)}>
            {info.emoji} {info.label}
          </span>
          <p className="mt-2 text-lg font-extrabold text-navy">
            {subscription.plan ? planLabels[subscription.plan] : "بلا خطة"}
          </p>
        </div>
        {!compact && (
          <Link
            href="/developer/subscription"
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-navy transition-colors hover:bg-slate-50"
          >
            إدارة الاشتراك
          </Link>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
          <LayoutGrid className="h-4 w-4 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500">التطبيقات</p>
            <p className="truncate text-sm font-bold text-navy">{limitLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500">تاريخ الانتهاء</p>
            <p className="truncate text-sm font-bold text-navy">
              {subscription.expiresAt ? formatDate(subscription.expiresAt) : "—"}
            </p>
          </div>
        </div>
      </div>

      {showExpiryWarning && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {remaining === 0
            ? "اشتراكك ينتهي اليوم."
            : `اشتراكك سينتهي خلال ${remaining} ${remaining === 1 ? "يوم" : "أيام"}.`}
        </p>
      )}
      {showExpiredWarning && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          انتهى اشتراكك، يرجى التجديد للاستمرار في نشر تطبيقات جديدة.
        </p>
      )}
      {!showExpiredWarning && atLimit && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          وصلت إلى الحد الأقصى لتطبيقات خطتك.
        </p>
      )}
    </div>
  );
}
