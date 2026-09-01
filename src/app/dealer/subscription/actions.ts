"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { logSecurityEvent } from "@/lib/security/audit";
import { hasPendingSubscriptionRequest } from "@/lib/supabase/queries";
import { validateImageFile, IMAGE_CONTENT_TYPE, IMAGE_EXTENSION } from "@/lib/uploads/image-validation";

const PROOF_BUCKET = "subscription-payment-proofs";
const MAX_PROOF_SIZE = 5 * 1024 * 1024;
const GENERIC_FAILURE = "تعذر إرسال طلب الاشتراك، حاول مرة أخرى لاحقًا.";

export type SubmitSubscriptionRequestResult = { ok: true } | { ok: false; error: string };

// Same pattern as submitClaimEvidenceAction/submitOwnershipClaimAction:
// content-sniffed file validation, upload first, insert second, and the
// upload is removed if the insert fails so no orphaned proof survives a
// failed request. Price/limit are never hard-coded here -- both are read
// from the dealer-chosen subscription_plans row and snapshotted onto the
// request at submit time.
//
// Deliberately open to ANY signed-in user, not just existing dealers:
// becoming a dealer is the OUTCOME of an admin-approved request (see
// review_subscription_request), not a precondition for submitting one --
// otherwise a regular user hitting the free-tier limit would have no way
// to act on the "اشترك الآن" CTA at all. RLS
// (dealer_subscription_requests_insert_own) mirrors this same relaxation.
export async function submitSubscriptionRequestAction(
  planId: string,
  paymentMethodId: string,
  proofFile: File
): Promise<SubmitSubscriptionRequestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "يجب تسجيل الدخول أولًا." };

  const rate = await checkRateLimit(
    `subscription_request:user:${user.id}`,
    RATE_LIMITS.SUBSCRIPTION_REQUEST_SUBMIT_PER_USER.limit,
    RATE_LIMITS.SUBSCRIPTION_REQUEST_SUBMIT_PER_USER.windowSeconds
  );
  if (!rate.allowed) {
    await logSecurityEvent({
      eventType: "subscription_request_rate_limited",
      actorId: user.id,
      actorRole: "authenticated",
    });
    return { ok: false, error: "لقد تجاوزت الحد المسموح به لطلبات الاشتراك، حاول لاحقًا." };
  }

  if (await hasPendingSubscriptionRequest(user.id)) {
    return { ok: false, error: "لديك طلب اشتراك قيد المراجعة بالفعل. انتظر البت فيه قبل إرسال طلب جديد." };
  }

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id, monthly_price_sdg, max_devices")
    .eq("id", planId)
    .eq("is_active", true)
    .maybeSingle();
  if (!plan) return { ok: false, error: "الخطة المختارة غير متاحة حاليًا." };

  const { data: paymentMethod } = await supabase
    .from("payment_methods")
    .select("id")
    .eq("id", paymentMethodId)
    .eq("is_active", true)
    .maybeSingle();
  if (!paymentMethod) return { ok: false, error: "وسيلة الدفع المختارة غير متاحة حاليًا." };

  const buffer = Buffer.from(await proofFile.arrayBuffer());
  const validated = validateImageFile(buffer, MAX_PROOF_SIZE, "إثبات الدفع");
  if (!validated.ok) return { ok: false, error: validated.error };

  const path = `${user.id}/${randomUUID()}.${IMAGE_EXTENSION[validated.type]}`;
  const { error: uploadError } = await supabase.storage
    .from(PROOF_BUCKET)
    .upload(path, buffer, { contentType: IMAGE_CONTENT_TYPE[validated.type] });

  if (uploadError) {
    await logSecurityEvent({
      eventType: "subscription_request_failed",
      actorId: user.id,
      actorRole: "authenticated",
      metadata: { plan_id: planId, stage: "upload" },
    });
    return { ok: false, error: "تعذر رفع إثبات الدفع، حاول مرة أخرى." };
  }

  const { error: insertError } = await supabase.from("dealer_subscription_requests").insert({
    dealer_id: user.id,
    plan_id: plan.id,
    amount_sdg: plan.monthly_price_sdg,
    max_devices_snapshot: plan.max_devices,
    payment_method_id: paymentMethod.id,
    payment_proof_path: path,
  });

  if (insertError) {
    await supabase
      .storage.from(PROOF_BUCKET)
      .remove([path])
      .catch(() => {});
    await logSecurityEvent({
      eventType: "subscription_request_failed",
      actorId: user.id,
      actorRole: "authenticated",
      metadata: { plan_id: planId, stage: "insert" },
    });
    return { ok: false, error: GENERIC_FAILURE };
  }

  await logSecurityEvent({
    eventType: "subscription_request_submitted",
    actorId: user.id,
    actorRole: "authenticated",
    metadata: { plan_id: planId },
  });

  revalidatePath("/dealer/subscription");
  return { ok: true };
}

export type UpdateDealerProfileResult = { ok: true } | { ok: false; error: string };

// Business-profile fields only -- role/is_dealer are outside this action's
// update payload entirely, and are additionally locked down at the DB
// level by the existing profiles_protect_columns_update trigger regardless
// of what a client sends.
export async function updateDealerProfileAction(input: {
  businessName: string;
  contactName: string;
  phone: string;
  address: string;
}): Promise<UpdateDealerProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "يجب تسجيل الدخول أولًا." };

  const { error } = await supabase
    .from("profiles")
    .update({
      business_name: input.businessName.trim() || null,
      contact_name: input.contactName.trim() || null,
      phone: input.phone.trim() || null,
      address: input.address.trim() || null,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: "تعذر حفظ البيانات، حاول مرة أخرى." };

  revalidatePath("/dealer/subscription");
  return { ok: true };
}

export type UploadLogoResult = { ok: true } | { ok: false; error: string };

const LOGO_BUCKET = "dealer-logos";
const MAX_LOGO_SIZE = 2 * 1024 * 1024;

export async function uploadDealerLogoAction(file: File): Promise<UploadLogoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "يجب تسجيل الدخول أولًا." };

  const { data: profile } = await supabase.from("profiles").select("logo_path").eq("id", user.id).maybeSingle();
  if (!profile) return { ok: false, error: "تعذر تحميل بيانات الحساب." };

  const buffer = Buffer.from(await file.arrayBuffer());
  const validated = validateImageFile(buffer, MAX_LOGO_SIZE, "الشعار");
  if (!validated.ok) return { ok: false, error: validated.error };

  const path = `${user.id}/logo-${randomUUID()}.${IMAGE_EXTENSION[validated.type]}`;
  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, buffer, { contentType: IMAGE_CONTENT_TYPE[validated.type] });
  if (uploadError) return { ok: false, error: "تعذر رفع الشعار، حاول مرة أخرى." };

  const { error: updateError } = await supabase.from("profiles").update({ logo_path: path }).eq("id", user.id);
  if (updateError) {
    await supabase
      .storage.from(LOGO_BUCKET)
      .remove([path])
      .catch(() => {});
    return { ok: false, error: "تعذر حفظ الشعار، حاول مرة أخرى." };
  }

  // dealer-logos allows update/delete (unlike the append-only evidence
  // buckets), so the previous logo file is removed once the new one is
  // safely referenced -- never before, so a failed upload never leaves the
  // dealer with no logo at all.
  const previousPath = profile.logo_path;
  if (previousPath && previousPath !== path) {
    await supabase
      .storage.from(LOGO_BUCKET)
      .remove([previousPath])
      .catch(() => {});
  }

  revalidatePath("/dealer/subscription");
  return { ok: true };
}
