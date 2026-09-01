"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import type { Database } from "@/lib/supabase/database.types";

type OwnershipClaimStatus = Database["public"]["Enums"]["ownership_claim_status"];
type DeviceReportStatus = Database["public"]["Enums"]["device_report_status"];
type DeviceStatus = Database["public"]["Enums"]["device_status"];

// Same defense-in-depth pattern as src/app/admin/actions.ts::requireAdmin --
// review_ownership_claim/review_device_report already re-check
// auth.role()='service_role' or current_user_role()='admin' themselves
// (the actual enforcement, unbypassable from here), this is only for a
// clean error message instead of a raw RPC failure.
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("غير مصرح: هذا الإجراء متاح للمشرفين فقط.");
  }
  return user;
}

export type ReviewResult = { ok: true } | { ok: false; error: string };

export async function reviewOwnershipClaimAction(
  claimId: string,
  newStatus: OwnershipClaimStatus,
  note?: string | null
): Promise<ReviewResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_ownership_claim", {
    p_claim_id: claimId,
    p_new_status: newStatus,
    p_note: (note ?? "").trim() || undefined,
  });

  if (error) return { ok: false, error: "تعذر تنفيذ الإجراء، حاول مرة أخرى." };

  revalidatePath("/admin/devices/claims");
  revalidatePath(`/admin/devices/claims/${claimId}`);
  return { ok: true };
}

export async function reviewDeviceReportAction(
  reportId: string,
  newStatus: DeviceReportStatus,
  note?: string | null
): Promise<ReviewResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_device_report", {
    p_report_id: reportId,
    p_new_status: newStatus,
    p_admin_note: (note ?? "").trim() || undefined,
  });

  if (error) return { ok: false, error: "تعذر تنفيذ الإجراء، حاول مرة أخرى." };

  revalidatePath("/admin/devices/reports");
  revalidatePath(`/admin/devices/reports/${reportId}`);
  return { ok: true };
}

// transition_device_status (Phase 1) re-checks auth.role()='service_role'
// or current_user_role()='admin' itself and enforces
// is_valid_device_status_transition() server-side -- this action cannot
// force an invalid or unauthorized transition regardless of what the
// client sends. reason is stored in the immutable device_status_history
// row (source='admin_dashboard').
export async function transitionDeviceStatusAction(
  deviceId: string,
  newStatus: DeviceStatus,
  reason?: string | null
): Promise<ReviewResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_device_status", {
    p_device_id: deviceId,
    p_new_status: newStatus,
    p_reason: (reason ?? "").trim() || "",
    p_source: "admin_dashboard",
  });

  if (error) return { ok: false, error: "تعذر تغيير حالة الجهاز، تأكد أن الانتقال مسموح به." };

  revalidatePath("/admin/devices");
  revalidatePath(`/admin/devices/${deviceId}`);
  revalidatePath("/admin");
  return { ok: true };
}
