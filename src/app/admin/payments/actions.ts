"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";

// Defense in depth: RLS + the approve/reject_payment_request() RPCs already
// re-check the admin role server-side (and payment_requests carries no
// insert/update policy for anyone else), but this explicit check is what
// actually stops a non-admin from ever reaching the RPC call in the first
// place, and gives a clear Arabic error instead of a raw Postgres one.
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("غير مصرح: هذا الإجراء متاح للمشرفين فقط.");
  }
  return user;
}

function revalidatePaymentPaths(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  revalidatePath(`/admin/payments/${id}`);
}

export async function approvePaymentAction(formData: FormData) {
  await requireAdmin();
  const requestId = formData.get("requestId") as string;
  const adminNote = ((formData.get("adminNote") as string | null) || "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_payment_request", {
    p_request_id: requestId,
    p_admin_note: adminNote ?? undefined,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePaymentPaths(requestId);
}

export async function rejectPaymentAction(formData: FormData) {
  await requireAdmin();
  const requestId = formData.get("requestId") as string;
  const adminNote = (formData.get("adminNote") as string | null)?.trim();

  if (!adminNote) {
    throw new Error("سبب الرفض مطلوب.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_payment_request", {
    p_request_id: requestId,
    p_admin_note: adminNote,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePaymentPaths(requestId);
}
