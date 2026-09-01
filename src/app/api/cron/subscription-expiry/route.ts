import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Runs once daily via Vercel Cron (see vercel.json). Uses the service-role
// client the same way rate-limit.ts/audit.ts already do for background
// work that isn't tied to any signed-in session -- this route is the only
// place in the app that needs to read/write dealer_subscriptions and
// notifications outside of a real user's own RLS-scoped request.
//
// Protected by CRON_SECRET: Vercel calls this URL with no browser session,
// so without a shared secret anyone who finds the URL could trigger it
// repeatedly. Must be added to Vercel's Production environment variables
// separately from this code (not committed anywhere) -- until it's set,
// this route refuses every request rather than running unauthenticated.

const DAY_MS = 24 * 60 * 60 * 1000;
const DEDUP_WINDOW_MS = 20 * 60 * 60 * 1000; // don't re-notify inside a ~20h window

function daysRemaining(expiresAt: string): number {
  return Math.floor((new Date(expiresAt).getTime() - Date.now()) / DAY_MS);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: subs } = await supabase
    .from("dealer_subscriptions")
    .select("id, dealer_id, status, expires_at")
    .eq("status", "active");

  let expiringNotified = 0;
  let expiredFlipped = 0;

  for (const sub of subs ?? []) {
    const remaining = daysRemaining(sub.expires_at);

    if (remaining < 0) {
      await supabase.from("dealer_subscriptions").update({ status: "expired" }).eq("id", sub.id);

      const { data: recent } = await supabase
        .from("notifications")
        .select("created_at")
        .eq("user_id", sub.dealer_id)
        .eq("type", "subscription_expired")
        .eq("related_id", sub.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!recent || Date.now() - new Date(recent.created_at).getTime() > DEDUP_WINDOW_MS) {
        await supabase.from("notifications").insert({
          user_id: sub.dealer_id,
          type: "subscription_expired",
          title: "انتهى اشتراكك",
          body: "انتهت صلاحية اشتراكك. جدّد الآن لمواصلة تسجيل الأجهزة.",
          related_table: "dealer_subscriptions",
          related_id: sub.id,
        });
        expiredFlipped++;
      }
      continue;
    }

    if (remaining === 7 || remaining === 3 || remaining === 0) {
      const { data: recent } = await supabase
        .from("notifications")
        .select("created_at")
        .eq("user_id", sub.dealer_id)
        .eq("type", "subscription_expiring_soon")
        .eq("related_id", sub.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!recent || Date.now() - new Date(recent.created_at).getTime() > DEDUP_WINDOW_MS) {
        const body =
          remaining === 0
            ? "ينتهي اشتراكك اليوم. جدّده الآن لتجنّب توقف تسجيل الأجهزة الجديدة."
            : `يتبقى ${remaining} ${remaining === 3 ? "أيام" : "أيام"} على انتهاء اشتراكك. جدّده لتجنّب أي انقطاع.`;
        await supabase.from("notifications").insert({
          user_id: sub.dealer_id,
          type: "subscription_expiring_soon",
          title: "اشتراكك على وشك الانتهاء",
          body,
          related_table: "dealer_subscriptions",
          related_id: sub.id,
        });
        expiringNotified++;
      }
    }
  }

  return NextResponse.json({ ok: true, checked: subs?.length ?? 0, expiringNotified, expiredFlipped });
}
