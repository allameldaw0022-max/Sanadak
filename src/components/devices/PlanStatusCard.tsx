import Link from "next/link";
import { AlertTriangle, CalendarClock, RefreshCw, Smartphone } from "lucide-react";
import { cn, daysUntil, formatDate, getDeviceUsageState } from "@/lib/utils";
import type { DealerSubscriptionStatus } from "@/lib/supabase/queries";

// Same 7-day threshold the subscription-expiry cron already uses
// (src/app/api/cron/subscription-expiry/route.ts) -- reusing it here (not
// inventing a new number) just means this in-page nudge and the eventual
// notification agree on what "about to expire" means.
const EXPIRY_WARNING_DAYS = 7;

function pluralDevices(n: number): string {
  return n === 1 ? "جهاز" : "أجهزة";
}

// Renders the dealer's current-subscription summary: plan name, live
// price/billing interval (display only -- what was actually charged is the
// snapshot on the request, untouched here), usage with three visual+text
// states (normal/near/reached, never color-only), and either an expired
// banner or a same-page "about to expire" nudge computed entirely from
// expiresAt (no new query, no cron, no notification system).
export function PlanStatusCard({ status }: { status: NonNullable<DealerSubscriptionStatus> }) {
  const { planName, monthlyPriceSdg, billingInterval, maxDevices, usedDevices, isCurrentlyActive, expiresAt } = status;

  // Mirrors the badge logic this card replaces: a subscription whose
  // expires_at has already passed reads as "منتهي" here even if the daily
  // cron hasn't flipped the DB status column to 'expired' yet.
  const isExpired = !isCurrentlyActive;

  const remaining = Math.max(0, maxDevices - usedDevices);
  const ratio = maxDevices > 0 ? usedDevices / maxDevices : 0;
  const usageState = getDeviceUsageState(usedDevices, maxDevices);
  const barColor = usageState === "reached" ? "bg-red-500" : usageState === "near" ? "bg-amber-500" : "bg-primary";

  const daysRemaining = daysUntil(expiresAt);
  const showExpiryWarning = isCurrentlyActive && daysRemaining >= 0 && daysRemaining <= EXPIRY_WARNING_DAYS;

  const billingLabel = billingInterval === "monthly" ? "شهريًا" : billingInterval;

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-navy">{planName}</p>
          <p className="mt-0.5 text-xs text-slate-500" dir="ltr">
            {monthlyPriceSdg.toLocaleString("ar-SD")} SDG / {billingLabel}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold",
            isExpired ? "bg-red-50 text-red-600" : "bg-primary-light text-primary-dark"
          )}
        >
          {isExpired ? "منتهي" : "فعال"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
        <Smartphone className="h-4 w-4 shrink-0" />
        {usageState === "reached"
          ? `وصلت إلى الحد الأقصى لأجهزتك (${maxDevices} من ${maxDevices})`
          : `استخدمت ${usedDevices} من ${maxDevices} جهازًا`}
      </div>

      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={usedDevices}
        aria-valuemin={0}
        aria-valuemax={maxDevices}
      >
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </div>

      {usageState === "reached" ? (
        <p className="mt-2 text-xs font-semibold text-red-600">لا يمكنك تسجيل أجهزة إضافية ضمن خطتك الحالية.</p>
      ) : usageState === "near" ? (
        <p className="mt-2 text-xs font-semibold text-amber-700">
          اقتربت من الحد المسموح — بقي لك {remaining} {pluralDevices(remaining)}.
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          بقي لك {remaining} {pluralDevices(remaining)}.
        </p>
      )}

      {isExpired ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="flex items-start gap-2 text-xs font-semibold text-red-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            انتهى اشتراكك في {formatDate(expiresAt)} — جدّد الآن لمواصلة تسجيل الأجهزة.
          </p>
          <Link
            href="#subscribe-form"
            className="mt-2.5 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-navy text-xs font-bold text-white transition-colors hover:bg-slate-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            جدّد الآن
          </Link>
        </div>
      ) : showExpiryWarning ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
          {daysRemaining === 0
            ? "ينتهي اشتراكك اليوم."
            : `يتبقى ${daysRemaining} ${daysRemaining === 1 ? "يوم" : "أيام"} على انتهاء اشتراكك.`}
        </p>
      ) : (
        <p className="mt-3 text-xs text-slate-500">ينتهي الاشتراك في {formatDate(expiresAt)}</p>
      )}
    </div>
  );
}
