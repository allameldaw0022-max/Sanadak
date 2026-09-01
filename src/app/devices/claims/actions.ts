"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, applyProgressiveDelay, RATE_LIMITS } from "@/lib/security/rate-limit";
import { logSecurityEvent } from "@/lib/security/audit";
import { hashImei } from "@/lib/devices/imei-hash";
import { isValidImei, normalizeImei } from "@/lib/devices/imei-format";
import { validateImageFile, IMAGE_CONTENT_TYPE, IMAGE_EXTENSION } from "@/lib/uploads/image-validation";

const GENERIC_CLAIM_FAILURE = "تعذر تقديم المطالبة، حاول مرة أخرى لاحقًا.";
const EVIDENCE_BUCKET = "ownership-evidence";
const MAX_EVIDENCE_SIZE = 5 * 1024 * 1024;

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for") ?? "unknown";
}

export type SubmitClaimResult = { ok: true; claimId: string } | { ok: false; error: string };

// Submits an ownership claim identified by IMEI (never device_id -- the
// client never sees one, matching Phase 2). Unlike checkImeiAction, a
// distinct "device not found" message here is a deliberate, documented
// choice (see submit_ownership_claim's comment in the migration): the
// caller must be authenticated, is dual rate-limited + delayed below, and
// every attempt is logged -- the same accountability model device_reports
// already relies on, not available to the anonymous public check.
export async function submitOwnershipClaimAction(input: {
  imei: string;
  note?: string | null;
}): Promise<SubmitClaimResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "يجب تسجيل الدخول أولًا." };

  const ip = await getClientIp();
  const [rateUser, rateIp] = await Promise.all([
    checkRateLimit(
      `ownership_claim:user:${user.id}`,
      RATE_LIMITS.OWNERSHIP_CLAIM_SUBMIT_PER_USER.limit,
      RATE_LIMITS.OWNERSHIP_CLAIM_SUBMIT_PER_USER.windowSeconds
    ),
    checkRateLimit(
      `ownership_claim:ip:${ip}`,
      RATE_LIMITS.OWNERSHIP_CLAIM_SUBMIT_PER_IP.limit,
      RATE_LIMITS.OWNERSHIP_CLAIM_SUBMIT_PER_IP.windowSeconds
    ),
  ]);
  if (!rateUser.allowed || !rateIp.allowed) {
    await logSecurityEvent({
      eventType: "ownership_claim_rate_limited",
      actorId: user.id,
      actorRole: "authenticated",
    });
    return { ok: false, error: "لقد تجاوزت الحد المسموح به لتقديم المطالبات، حاول لاحقًا." };
  }

  const ipUsed = RATE_LIMITS.OWNERSHIP_CLAIM_SUBMIT_PER_IP.limit - rateIp.remaining;
  await applyProgressiveDelay(ipUsed);

  const normalized = normalizeImei(input.imei);
  if (!isValidImei(normalized)) {
    return { ok: false, error: "رقم IMEI غير صالح. تأكد من إدخال 15 رقمًا صحيحًا." };
  }

  let imeiHash: string;
  try {
    imeiHash = hashImei(normalized);
  } catch {
    return { ok: false, error: "تعذر تنفيذ العملية حاليًا، حاول لاحقًا." };
  }

  const note = (input.note ?? "").trim() || null;

  const { data, error } = await supabase.rpc("submit_ownership_claim", {
    p_imei_hash: imeiHash,
    p_note: note ?? undefined,
  });

  if (error || !data) {
    // Never log the raw IMEI -- only its hash.
    await logSecurityEvent({
      eventType: "ownership_claim_failed",
      actorId: user.id,
      actorRole: "authenticated",
      metadata: { imei_hash: imeiHash, db_error: error?.message ?? null },
    });

    if (error?.message?.includes("already own device")) {
      return { ok: false, error: "هذا الجهاز مسجل باسمك بالفعل." };
    }
    if (error?.message?.includes("device not found")) {
      return { ok: false, error: "لم يتم العثور على جهاز مسجل بهذا الرقم على سندك." };
    }
    return { ok: false, error: GENERIC_CLAIM_FAILURE };
  }

  await logSecurityEvent({
    eventType: "ownership_claim_submitted",
    actorId: user.id,
    actorRole: "authenticated",
    metadata: { claim_id: data, imei_hash: imeiHash },
  });

  return { ok: true, claimId: data };
}

export type UploadEvidenceResult = { ok: true } | { ok: false; error: string };

// Evidence is validated by its real bytes server-side (never a client-
// supplied MIME type) before it's ever written to storage -- the stronger
// of the two upload patterns already in this codebase (app-icons/
// app_screenshots), not the weaker payment-proofs client-direct-upload
// pattern. Private bucket, folder-scoped by uploader, append-only (no
// UPDATE/DELETE storage policy exists at all).
export async function submitClaimEvidenceAction(claimId: string, file: File): Promise<UploadEvidenceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "يجب تسجيل الدخول أولًا." };

  const rate = await checkRateLimit(
    `ownership_evidence:user:${user.id}`,
    RATE_LIMITS.OWNERSHIP_EVIDENCE_UPLOAD_PER_USER.limit,
    RATE_LIMITS.OWNERSHIP_EVIDENCE_UPLOAD_PER_USER.windowSeconds
  );
  if (!rate.allowed) {
    await logSecurityEvent({
      eventType: "ownership_evidence_rate_limited",
      actorId: user.id,
      actorRole: "authenticated",
    });
    return { ok: false, error: "لقد تجاوزت الحد المسموح به لرفع الأدلة، حاول لاحقًا." };
  }

  // Explicit ownership + status check for a clear error message -- RLS
  // (ownership_evidence_insert_own) backs this up regardless.
  const { data: claim } = await supabase
    .from("ownership_claims")
    .select("id, status")
    .eq("id", claimId)
    .eq("claimant_id", user.id)
    .maybeSingle();

  if (!claim) return { ok: false, error: "المطالبة غير موجودة." };
  if (claim.status === "APPROVED" || claim.status === "REJECTED") {
    return { ok: false, error: "تم إغلاق هذه المطالبة، لا يمكن إضافة أدلة جديدة." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validated = validateImageFile(buffer, MAX_EVIDENCE_SIZE, "الدليل");
  if (!validated.ok) return { ok: false, error: validated.error };

  const path = `${user.id}/${randomUUID()}.${IMAGE_EXTENSION[validated.type]}`;
  const { error: uploadError } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(path, buffer, { contentType: IMAGE_CONTENT_TYPE[validated.type] });

  if (uploadError) {
    await logSecurityEvent({
      eventType: "ownership_evidence_upload_failed",
      actorId: user.id,
      actorRole: "authenticated",
      metadata: { claim_id: claimId },
    });
    return { ok: false, error: "تعذر رفع الملف، حاول مرة أخرى." };
  }

  const { error: insertError } = await supabase.from("ownership_evidence").insert({
    claim_id: claimId,
    uploader_id: user.id,
    storage_path: path,
  });

  if (insertError) {
    await supabase
      .storage.from(EVIDENCE_BUCKET)
      .remove([path])
      .catch(() => {});
    return { ok: false, error: "تعذر حفظ الدليل، حاول مرة أخرى." };
  }

  await logSecurityEvent({
    eventType: "ownership_evidence_uploaded",
    actorId: user.id,
    actorRole: "authenticated",
    metadata: { claim_id: claimId },
  });

  return { ok: true };
}
