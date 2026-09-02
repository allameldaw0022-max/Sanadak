"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, applyProgressiveDelay, RATE_LIMITS } from "@/lib/security/rate-limit";
import { logSecurityEvent } from "@/lib/security/audit";
import { isValidImei, normalizeImei } from "@/lib/devices/imei-format";
import { hashImei } from "@/lib/devices/imei-hash";
import { validateDeviceRegistrationInput, type DeviceRegistrationInput } from "@/lib/devices/validation";
import { buildImeiCheckDisclosure, type ImeiCheckDisclosure } from "@/lib/devices/check-response";

const GENERIC_REGISTRATION_FAILURE =
  "تعذر تسجيل الجهاز. يرجى التحقق من البيانات أو التواصل مع الدعم.";

export type RegisterDeviceResult =
  | { ok: true; deviceId: string }
  | { ok: false; error: string; limitReached?: true; ctaLabel?: string };

// register_device() raises a distinct machine-readable prefix for each of
// its three limit-related rejections (see the register_device_free_tier_limit
// migration) -- mapped here to the exact user-facing copy + CTA label,
// matching the established pattern of distinct RPC error substrings already
// used elsewhere (e.g. submitOwnershipClaimAction's "already own device").
const LIMIT_ERRORS: Record<string, { message: string; ctaLabel: string }> = {
  FREE_LIMIT_REACHED: {
    message: "انتهت الباقة المجانية. يمكنك تسجيل 3 أجهزة مجانًا. للاشتراك وتسجيل أجهزة إضافية، اشترك في باقة التاجر.",
    ctaLabel: "اشترك الآن",
  },
  DEALER_NO_SUBSCRIPTION: {
    message: "لا يوجد اشتراك فعال. يرجى الاشتراك أو تجديد الاشتراك أولاً.",
    ctaLabel: "اشترك الآن",
  },
  DEALER_LIMIT_REACHED: {
    message: "وصلت إلى الحد المسموح به في باقتك.",
    ctaLabel: "ترقية الباقة",
  },
};

function matchLimitError(message: string | undefined): { message: string; ctaLabel: string } | null {
  if (!message) return null;
  for (const prefix of Object.keys(LIMIT_ERRORS)) {
    if (message.includes(prefix)) return LIMIT_ERRORS[prefix];
  }
  return null;
}

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for") ?? "unknown";
}

// Registers a new device for the CURRENT session's user. owner_id and
// current_status never appear in this function's input type at all -- they
// are not client-controllable by construction, not just "not trusted": the
// only place they're set is auth.uid() and the devices table default,
// inside register_device() (supabase/migrations/20260901_device_verification_app_layer_rpcs.sql).
export async function registerDeviceAction(input: DeviceRegistrationInput): Promise<RegisterDeviceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "يجب تسجيل الدخول أولًا." };

  const ip = await getClientIp();
  const [rateUser, rateIp] = await Promise.all([
    checkRateLimit(
      `device_register:user:${user.id}`,
      RATE_LIMITS.DEVICE_REGISTER_PER_USER.limit,
      RATE_LIMITS.DEVICE_REGISTER_PER_USER.windowSeconds
    ),
    checkRateLimit(
      `device_register:ip:${ip}`,
      RATE_LIMITS.DEVICE_REGISTER_PER_IP.limit,
      RATE_LIMITS.DEVICE_REGISTER_PER_IP.windowSeconds
    ),
  ]);
  // Both must pass: a rotating IP can't outrun the per-account limit, and a
  // rotating account (on the same connection) can't outrun the per-IP limit.
  if (!rateUser.allowed || !rateIp.allowed) {
    await logSecurityEvent({
      eventType: "device_registration_rate_limited",
      actorId: user.id,
      actorRole: "authenticated",
    });
    return { ok: false, error: "لقد تجاوزت الحد المسموح به لتسجيل الأجهزة خلال ساعة، حاول لاحقًا." };
  }

  const validated = validateDeviceRegistrationInput(input);
  if (!validated.ok) return { ok: false, error: validated.error };
  const { brand, model, color, serialNumber, imei1Normalized, imei2Normalized } = validated.data;

  // SEC-07: imei_hash is no longer computed here and never leaves this
  // server for the register path. register_device() (the 6-parameter
  // SECURITY DEFINER signature) derives the HMAC itself, inside Postgres,
  // straight from the Vault-held secret -- so a caller (this action, or
  // anyone hitting the RPC directly with a valid session) can no longer
  // submit a forged imei_hash that doesn't match imei_normalized.
  // hashImei()/IMEI_HASH_SECRET are still used below, only by
  // checkImeiAction's read-only lookup path.
  const { data, error } = await supabase.rpc("register_device", {
    p_brand: brand,
    p_model: model,
    // register_device()'s p_color/p_serial_number have no SQL default, so
    // the generated type marks them as required `string` -- but the
    // parameters themselves happily accept NULL at the Postgres level
    // (only DEFAULT presence affects the generator's optionality, not
    // nullability). The cast bridges that generator gap; the RPC call
    // itself is unchanged from before.
    p_color: (color ?? null) as unknown as string,
    p_serial_number: (serialNumber ?? null) as unknown as string,
    p_imei1_normalized: imei1Normalized,
    p_imei2_normalized: imei2Normalized ?? undefined,
  });

  if (error || !data) {
    const limitMessage = matchLimitError(error?.message);
    await logSecurityEvent({
      eventType: "device_registration_failed",
      actorId: user.id,
      actorRole: "authenticated",
      metadata: { db_error_code: error?.code ?? null, limit_reached: !!limitMessage },
    });
    if (limitMessage) {
      return { ok: false, error: limitMessage.message, limitReached: true, ctaLabel: limitMessage.ctaLabel };
    }

    // Never distinguish "IMEI already registered" (unique_violation) from
    // any other failure in the response -- both a duplicate IMEI and an
    // unrelated DB error must look identical to the caller (see spec: a
    // distinct "this IMEI belongs to someone else" message is itself a
    // privacy leak). Never log the raw IMEI -- and the hash itself is no
    // longer known to this action at all, so there is nothing to log.
    return { ok: false, error: GENERIC_REGISTRATION_FAILURE };
  }

  await logSecurityEvent({
    eventType: "device_registered",
    actorId: user.id,
    actorRole: "authenticated",
    metadata: { device_id: data },
  });

  return { ok: true, deviceId: data };
}

export type CheckImeiResult = { ok: true; result: ImeiCheckDisclosure } | { ok: false; error: string };

// Public IMEI check. Deliberately a Server Action (POST-only, no query
// string) rather than a GET route -- an IMEI must never appear in a URL,
// browser history, referrer header, or web server access log.
export async function checkImeiAction(rawImei: string): Promise<CheckImeiResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ip = await getClientIp();
  const [rateIp, rateUser] = await Promise.all([
    checkRateLimit(
      `imei-check:ip:${ip}`,
      RATE_LIMITS.IMEI_CHECK_PER_IP.limit,
      RATE_LIMITS.IMEI_CHECK_PER_IP.windowSeconds
    ),
    user
      ? checkRateLimit(
          `imei-check:user:${user.id}`,
          RATE_LIMITS.IMEI_CHECK_PER_USER.limit,
          RATE_LIMITS.IMEI_CHECK_PER_USER.windowSeconds
        )
      : Promise.resolve({ allowed: true, remaining: RATE_LIMITS.IMEI_CHECK_PER_USER.limit }),
  ]);

  // Both the IP counter and (when signed in) the account counter must pass:
  // switching accounts on the same connection can't outrun the IP limit,
  // and switching IP on the same account can't outrun the account limit.
  if (!rateIp.allowed || !rateUser.allowed) {
    await logSecurityEvent({
      eventType: "imei_check_rate_limited",
      actorId: user?.id ?? null,
      actorRole: user ? "authenticated" : "anonymous",
    });
    return { ok: false, error: "تم تجاوز الحد المسموح لعمليات الفحص، حاول لاحقًا." };
  }

  // Progressive delay keyed off the IP counter -- the vector an anonymous
  // scripted sweep actually depends on. Applied for every request that
  // passed the hard rate-limit check above, valid IMEI or not, so the delay
  // itself never becomes a signal for input validity.
  const ipUsed = RATE_LIMITS.IMEI_CHECK_PER_IP.limit - rateIp.remaining;
  await applyProgressiveDelay(ipUsed);

  const normalized = normalizeImei(rawImei);
  if (!isValidImei(normalized)) {
    // A malformed IMEI can never exist in the database (every stored IMEI
    // passes the same Luhn/length check, enforced again at the DB level by
    // device_imeis_luhn_check) -- saying so leaks nothing about what IS in
    // the database, so it's safe to give a distinct, more useful message
    // here than the generic non-disclosure one below.
    return { ok: false, error: "رقم IMEI غير صالح. تأكد من إدخال 15 رقمًا صحيحًا." };
  }

  let imeiHash: string;
  try {
    imeiHash = hashImei(normalized);
  } catch {
    return { ok: false, error: "تعذر تنفيذ الفحص حاليًا، حاول لاحقًا." };
  }

  const { data, error } = await supabase.rpc("public_check_device_status", { p_imei_hash: imeiHash });

  await logSecurityEvent({
    eventType: "imei_check",
    actorId: user?.id ?? null,
    actorRole: user ? "authenticated" : "anonymous",
    metadata: { imei_hash: imeiHash },
  });

  if (error) {
    return { ok: false, error: "تعذر تنفيذ الفحص حاليًا، حاول لاحقًا." };
  }

  const status = data?.[0]?.status ?? null;
  return { ok: true, result: buildImeiCheckDisclosure(status) };
}
