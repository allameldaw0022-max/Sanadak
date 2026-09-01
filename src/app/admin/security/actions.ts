"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { logSecurityEvent } from "@/lib/security/audit";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("غير مصرح: هذا الإجراء متاح للمشرفين فقط.");
  }
  return user;
}

function revalidateSecurityPaths(appId: string) {
  revalidatePath("/admin/security");
  revalidatePath("/admin/apps");
  revalidatePath(`/admin/apps/${appId}`);
}

// These three only ever move `apps.security_status` between the three
// terminal states a human review can decide on. They never touch
// `status` (the separate business pending/approved/rejected workflow) —
// an app still needs both a security pass AND a business approval before
// apps_select_approved_own_or_admin makes it publicly visible.

export async function approveSecurityAction(formData: FormData) {
  const admin = await requireAdmin();
  const appId = formData.get("appId") as string;

  const supabase = await createClient();
  await supabase.from("apps").update({ security_status: "passed" }).eq("id", appId);

  await logSecurityEvent({
    eventType: "security_approved",
    actorId: admin.id,
    actorRole: "admin",
    appId,
  });
  await logSecurityEvent({ eventType: "admin_reviewed", actorId: admin.id, actorRole: "admin", appId });

  revalidateSecurityPaths(appId);
}

export async function rejectSecurityAction(formData: FormData) {
  const admin = await requireAdmin();
  const appId = formData.get("appId") as string;
  const reason = (formData.get("reason") as string | null)?.trim();
  if (!reason) throw new Error("سبب الرفض الأمني مطلوب.");

  const supabase = await createClient();
  await supabase.from("apps").update({ security_status: "failed" }).eq("id", appId);

  await logSecurityEvent({
    eventType: "security_rejected",
    actorId: admin.id,
    actorRole: "admin",
    appId,
    metadata: { reason },
  });
  await logSecurityEvent({ eventType: "admin_reviewed", actorId: admin.id, actorRole: "admin", appId });

  revalidateSecurityPaths(appId);
}

export async function requestSecurityReviewAction(formData: FormData) {
  const admin = await requireAdmin();
  const appId = formData.get("appId") as string;

  const supabase = await createClient();
  await supabase.from("apps").update({ security_status: "review_required" }).eq("id", appId);

  await logSecurityEvent({
    eventType: "security_review_required",
    actorId: admin.id,
    actorRole: "admin",
    appId,
  });

  revalidateSecurityPaths(appId);
}

export async function emergencyDisableAction(formData: FormData) {
  const admin = await requireAdmin();
  const appId = formData.get("appId") as string;
  const reason = (formData.get("reason") as string | null)?.trim();
  if (!reason) throw new Error("سبب الإيقاف الطارئ مطلوب.");

  const supabase = await createClient();
  await supabase
    .from("apps")
    .update({
      emergency_disabled: true,
      emergency_disabled_reason: reason,
      emergency_disabled_by: admin.id,
      emergency_disabled_at: new Date().toISOString(),
    })
    .eq("id", appId);

  await logSecurityEvent({
    eventType: "emergency_disabled",
    actorId: admin.id,
    actorRole: "admin",
    appId,
    metadata: { reason },
  });

  revalidateSecurityPaths(appId);
}

export async function emergencyReenableAction(formData: FormData) {
  const admin = await requireAdmin();
  const appId = formData.get("appId") as string;

  const supabase = await createClient();
  await supabase
    .from("apps")
    .update({
      emergency_disabled: false,
      emergency_disabled_reason: null,
      emergency_disabled_by: null,
      emergency_disabled_at: null,
    })
    .eq("id", appId);

  await logSecurityEvent({
    eventType: "emergency_reenabled",
    actorId: admin.id,
    actorRole: "admin",
    appId,
  });

  revalidateSecurityPaths(appId);
}
