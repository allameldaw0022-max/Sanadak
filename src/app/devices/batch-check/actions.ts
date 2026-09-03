"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, applyProgressiveDelay, RATE_LIMITS, BATCH_IMEI_CHECK_MAX_ITEMS } from "@/lib/security/rate-limit";
import { logSecurityEvent } from "@/lib/security/audit";
import { isValidImei, normalizeImei } from "@/lib/devices/imei-format";
import { hashImei } from "@/lib/devices/imei-hash";
import { buildImeiCheckDisclosure, type ImeiCheckDisclosure } from "@/lib/devices/check-response";

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for") ?? "unknown";
}

export type BatchCheckResultItem = { imeiInput: string; result: ImeiCheckDisclosure | { error: string } };
export type BatchCheckResult = { ok: true; items: BatchCheckResultItem[] } | { ok: false; error: string };

// Batch IMEI check: same disclosure rules as the single public check
// (checkImeiAction/public_check_device_status, both untouched) applied to
// up to BATCH_IMEI_CHECK_MAX_ITEMS numbers per call -- this reuses
// buildImeiCheckDisclosure so BLOCKED stays indistinguishable from
// not-found here exactly like it does in the single-check flow, and never
// widens what public_check_device_status itself returns.
//
// Requires authentication (unlike the anonymous single check): a batch
// endpoint is a materially larger enumeration surface, so accountability
// (auth + dual rate limiting, same pattern as ownership claims/reports) is
// required before any batch is processed at all.
export async function batchCheckImeiAction(rawImeis: string[]): Promise<BatchCheckResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "يجب تسجيل الدخول أولًا." };

  if (!Array.isArray(rawImeis) || rawImeis.length === 0) {
    return { ok: false, error: "أدخل رقم IMEI واحدًا على الأقل." };
  }
  if (rawImeis.length > BATCH_IMEI_CHECK_MAX_ITEMS) {
    return { ok: false, error: `الحد الأقصى ${BATCH_IMEI_CHECK_MAX_ITEMS} رقمًا في الطلب الواحد.` };
  }

  const ip = await getClientIp();
  const [rateUser, rateIp] = await Promise.all([
    checkRateLimit(
      `batch_imei:user:${user.id}`,
      RATE_LIMITS.BATCH_IMEI_CHECK_PER_USER.limit,
      RATE_LIMITS.BATCH_IMEI_CHECK_PER_USER.windowSeconds
    ),
    checkRateLimit(
      `batch_imei:ip:${ip}`,
      RATE_LIMITS.BATCH_IMEI_CHECK_PER_IP.limit,
      RATE_LIMITS.BATCH_IMEI_CHECK_PER_IP.windowSeconds
    ),
  ]);
  if (!rateUser.allowed || !rateIp.allowed) {
    await logSecurityEvent({
      eventType: "batch_imei_check_rate_limited",
      actorId: user.id,
      actorRole: "authenticated",
    });
    return { ok: false, error: "تم تجاوز الحد المسموح لعمليات الفحص الجماعي، حاول لاحقًا." };
  }

  const ipUsed = RATE_LIMITS.BATCH_IMEI_CHECK_PER_IP.limit - rateIp.remaining;
  await applyProgressiveDelay(ipUsed);

  const items: BatchCheckResultItem[] = [];
  const hashes: string[] = [];

  for (const raw of rawImeis) {
    const normalized = normalizeImei(raw);
    if (!isValidImei(normalized)) {
      items.push({ imeiInput: raw, result: { error: "رقم IMEI غير صالح" } });
      continue;
    }
    let imeiHash: string;
    try {
      imeiHash = hashImei(normalized);
    } catch {
      items.push({ imeiInput: raw, result: { error: "تعذر تنفيذ الفحص حاليًا" } });
      continue;
    }
    hashes.push(imeiHash);
    const { data } = await supabase.rpc("public_check_device_status", { p_imei_hash: imeiHash });
    const status = data?.[0]?.status ?? null;
    // Batch check is a materially larger enumeration/scraping surface than
    // the single check (see the function comment above) -- deliberately
    // never surfaces owner_display_name here, regardless of what the RPC
    // returns for a single row, to avoid bulk-exposing masked owner names
    // across many devices in one authenticated call.
    items.push({ imeiInput: raw, result: buildImeiCheckDisclosure(status, null) });
  }

  // Only hashes are logged, one aggregate event per batch -- never the raw
  // IMEIs, and never per-item (which would multiply log volume with the
  // batch size for no benefit).
  await logSecurityEvent({
    eventType: "batch_imei_check",
    actorId: user.id,
    actorRole: "authenticated",
    metadata: { count: hashes.length, imei_hashes: hashes },
  });

  return { ok: true, items };
}
