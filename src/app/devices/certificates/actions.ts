"use server";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { logSecurityEvent } from "@/lib/security/audit";

export type IssueCertificateResult = { ok: true; certificateId: string } | { ok: false; error: string };

// Idempotent-by-device, same shape as submit_ownership_claim's own-existing-
// claim handling: if the caller already holds a certificate for this
// device, reuse it instead of piling up duplicates. RLS
// (device_certificates_insert_own_device) is the real enforcement that the
// caller currently owns the device -- this action's own select-first check
// only exists to (a) implement the idempotency and (b) return a clear
// Arabic error instead of a raw RLS violation.
export async function issueCertificateAction(deviceId: string): Promise<IssueCertificateResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "يجب تسجيل الدخول أولًا." };

  const rate = await checkRateLimit(
    `certificate_issue:user:${user.id}`,
    RATE_LIMITS.CERTIFICATE_ISSUE_PER_USER.limit,
    RATE_LIMITS.CERTIFICATE_ISSUE_PER_USER.windowSeconds
  );
  if (!rate.allowed) {
    return { ok: false, error: "لقد تجاوزت الحد المسموح به لإصدار الشهادات، حاول لاحقًا." };
  }

  const { data: device } = await supabase
    .from("devices")
    .select("id")
    .eq("id", deviceId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!device) return { ok: false, error: "هذا الجهاز غير موجود أو لا يخصك." };

  const { data: existing } = await supabase
    .from("device_certificates")
    .select("id")
    .eq("device_id", device.id)
    .eq("issued_to", user.id)
    .maybeSingle();
  if (existing) return { ok: true, certificateId: existing.id };

  const { data: certificate, error } = await supabase
    .from("device_certificates")
    .insert({ device_id: device.id, issued_to: user.id })
    .select("id")
    .single();

  if (error || !certificate) {
    await logSecurityEvent({
      eventType: "certificate_issue_failed",
      actorId: user.id,
      actorRole: "authenticated",
      metadata: { device_id: device.id },
    });
    return { ok: false, error: "تعذر إصدار الشهادة، حاول مرة أخرى." };
  }

  await logSecurityEvent({
    eventType: "certificate_issued",
    actorId: user.id,
    actorRole: "authenticated",
    metadata: { device_id: device.id, certificate_id: certificate.id },
  });

  return { ok: true, certificateId: certificate.id };
}
