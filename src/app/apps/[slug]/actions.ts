"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

export async function submitReviewAction(formData: FormData) {
  const appId = formData.get("appId") as string;
  const slug = formData.get("slug") as string;
  const rating = Number(formData.get("rating"));
  const comment = ((formData.get("comment") as string | null) || "").trim() || null;

  if (!appId || !rating || rating < 1 || rating > 5) {
    throw new Error("تقييم غير صالح.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول أولًا.");

  const rate = await checkRateLimit(
    `review:${user.id}`,
    RATE_LIMITS.REVIEW_PER_USER.limit,
    RATE_LIMITS.REVIEW_PER_USER.windowSeconds
  );
  if (!rate.allowed) {
    throw new Error("لقد أرسلت عدد كبير من التقييمات خلال وقت قصير، حاول لاحقًا.");
  }

  await supabase
    .from("reviews")
    .upsert({ app_id: appId, user_id: user.id, rating, comment }, { onConflict: "app_id,user_id" });

  revalidatePath(`/apps/${slug}`);
}

export async function submitReportAction(formData: FormData) {
  const appId = formData.get("appId") as string;
  const reason = formData.get("reason") as string;
  const details = ((formData.get("details") as string | null) || "").trim() || null;

  if (!appId || !reason) {
    throw new Error("طلب غير صالح.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const headerList = await headers();
  const identity = user ? `user:${user.id}` : `ip:${headerList.get("x-forwarded-for") ?? "unknown"}`;
  const rate = await checkRateLimit(
    `report:${identity}`,
    RATE_LIMITS.REPORT_PER_IDENTITY.limit,
    RATE_LIMITS.REPORT_PER_IDENTITY.windowSeconds
  );
  if (!rate.allowed) {
    throw new Error("لقد أرسلت عدد كبير من البلاغات خلال وقت قصير، حاول لاحقًا.");
  }

  await supabase.from("app_reports").insert({
    app_id: appId,
    reporter_id: user?.id ?? null,
    reason,
    details,
  });
}
