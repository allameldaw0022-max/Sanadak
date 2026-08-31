"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  await supabase.from("app_reports").insert({
    app_id: appId,
    reporter_id: user?.id ?? null,
    reason,
    details,
  });
}
