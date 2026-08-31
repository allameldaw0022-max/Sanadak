"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function approveAppAction(formData: FormData) {
  const appId = formData.get("appId") as string;
  const supabase = await createClient();
  await supabase.from("apps").update({ status: "approved" }).eq("id", appId);
  revalidatePath("/admin/apps");
}

export async function rejectAppAction(formData: FormData) {
  const appId = formData.get("appId") as string;
  const reason = (formData.get("reason") as string) || null;
  const supabase = await createClient();
  await supabase.from("apps").update({ status: "rejected", rejection_reason: reason }).eq("id", appId);
  revalidatePath("/admin/apps");
}
