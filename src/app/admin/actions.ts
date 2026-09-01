"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";

// Defense in depth: RLS already restricts writes to admins or the app's own
// developer, but a developer legitimately owns their own row, so this
// explicit role check is what actually stops a developer from calling this
// action on their own app to self-approve it.
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("غير مصرح: هذا الإجراء متاح للمشرفين فقط.");
  }
  return user;
}

function revalidateAppPaths(appId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/apps");
  revalidatePath(`/admin/apps/${appId}`);
}

export async function approveAppAction(formData: FormData) {
  const admin = await requireAdmin();
  const appId = formData.get("appId") as string;

  const supabase = await createClient();
  await supabase
    .from("apps")
    .update({
      status: "approved",
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", appId);

  revalidateAppPaths(appId);
}

export async function updateReportAction(formData: FormData) {
  await requireAdmin();
  const reportId = formData.get("reportId") as string;
  const status = formData.get("status") as string;
  const adminNote = ((formData.get("adminNote") as string | null) || "").trim() || null;

  const supabase = await createClient();
  await supabase
    .from("app_reports")
    .update({ status, admin_note: adminNote })
    .eq("id", reportId);

  revalidatePath("/admin/reports");
}

export async function setDealerStatusAction(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId") as string;
  const isDealer = formData.get("isDealer") === "true";

  const supabase = await createClient();
  await supabase.from("profiles").update({ is_dealer: isDealer }).eq("id", userId);

  revalidatePath("/admin/users");
}

export async function rejectAppAction(formData: FormData) {
  const admin = await requireAdmin();
  const appId = formData.get("appId") as string;
  const reason = (formData.get("reason") as string | null)?.trim();

  if (!reason) {
    throw new Error("سبب الرفض مطلوب.");
  }

  const supabase = await createClient();
  await supabase
    .from("apps")
    .update({
      status: "rejected",
      rejection_reason: reason,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", appId);

  revalidateAppPaths(appId);
}
