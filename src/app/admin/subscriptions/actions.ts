"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { logSecurityEvent } from "@/lib/security/audit";
import type { Database } from "@/lib/supabase/database.types";

type RequestStatus = Database["public"]["Enums"]["dealer_subscription_request_status"];

// Same defense-in-depth pattern as src/app/admin/devices/actions.ts --
// review_subscription_request() already re-checks current_user_role()=
// 'admin' itself (the real enforcement); this is only for a clean error
// message. subscription_plans/payment_methods writes below have no RPC --
// RLS (subscription_plans_insert/update/delete_admin,
// payment_methods_insert/update/delete_admin) is the actual gate, this is
// again only for a clean message instead of a raw RLS-denial error.
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("غير مصرح: هذا الإجراء متاح للمشرفين فقط.");
  }
  return user;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function reviewSubscriptionRequestAction(
  requestId: string,
  decision: Extract<RequestStatus, "approved" | "rejected">,
  rejectionReason?: string | null
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_subscription_request", {
    p_request_id: requestId,
    p_decision: decision,
    p_rejection_reason: (rejectionReason ?? "").trim() || undefined,
  });

  if (error) return { ok: false, error: "تعذر تنفيذ الإجراء، حاول مرة أخرى." };

  await logSecurityEvent({
    eventType: "subscription_request_reviewed",
    actorRole: "admin",
    metadata: { request_id: requestId, decision },
  });

  revalidatePath("/admin/subscriptions");
  return { ok: true };
}

export async function upsertSubscriptionPlanAction(input: {
  id?: string;
  name: string;
  monthlyPriceSdg: number;
  maxDevices: number;
  description: string;
  sortOrder: number;
}): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const row = {
    name: input.name.trim(),
    monthly_price_sdg: input.monthlyPriceSdg,
    max_devices: input.maxDevices,
    description: input.description.trim() || null,
    sort_order: input.sortOrder,
  };

  if (!row.name || row.monthly_price_sdg < 0 || row.max_devices <= 0) {
    return { ok: false, error: "تحقق من صحة البيانات المدخلة." };
  }

  const { error } = input.id
    ? await supabase.from("subscription_plans").update(row).eq("id", input.id)
    : await supabase.from("subscription_plans").insert(row);

  if (error) return { ok: false, error: "تعذر حفظ الخطة، حاول مرة أخرى." };

  revalidatePath("/admin/subscriptions/plans");
  return { ok: true };
}

export async function setSubscriptionPlanActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("subscription_plans").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: "تعذر تحديث حالة الخطة." };

  revalidatePath("/admin/subscriptions/plans");
  return { ok: true };
}

export async function upsertPaymentMethodAction(input: {
  id?: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  iban: string;
  phoneOrWallet: string;
  instructions: string;
}): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const row = {
    bank_name: input.bankName.trim(),
    account_holder_name: input.accountHolderName.trim(),
    account_number: input.accountNumber.trim(),
    iban: input.iban.trim() || null,
    phone_or_wallet: input.phoneOrWallet.trim() || null,
    instructions: input.instructions.trim() || null,
  };

  if (!row.bank_name || !row.account_holder_name || !row.account_number) {
    return { ok: false, error: "تحقق من صحة البيانات المدخلة." };
  }

  const { error } = input.id
    ? await supabase.from("payment_methods").update(row).eq("id", input.id)
    : await supabase.from("payment_methods").insert(row);

  if (error) return { ok: false, error: "تعذر حفظ وسيلة الدفع، حاول مرة أخرى." };

  revalidatePath("/admin/subscriptions/payment-methods");
  return { ok: true };
}

export async function setPaymentMethodActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("payment_methods").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: "تعذر تحديث حالة وسيلة الدفع." };

  revalidatePath("/admin/subscriptions/payment-methods");
  return { ok: true };
}
