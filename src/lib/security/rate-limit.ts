import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

// Fixed-window counter backed by security_rate_limits (service-role only,
// no RLS policy grants it to anon/authenticated at all). Works across
// serverless invocations, unlike an in-memory counter.
//
// The increment-and-compare happens atomically inside a single Postgres
// statement (check_and_increment_rate_limit: INSERT ... ON CONFLICT DO
// UPDATE ... RETURNING), serialized by Postgres's row-level locking on the
// unique `key` column -- concurrent/parallel callers for the same key can
// no longer under-count each other the way a separate SELECT-then-UPDATE
// could. The same RPC also backs the DB-level throttle embedded directly
// inside public_check_device_status(), so this file and that RPC always
// enforce limits consistently no matter which entry point is used.
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .rpc("check_and_increment_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })
    .single();

  if (error || !data) {
    // Fail closed: if the atomic check itself errors, treat the request as
    // not allowed rather than silently letting it through.
    return { allowed: false, remaining: 0 };
  }

  return { allowed: data.allowed, remaining: Math.max(limit - data.current_count, 0) };
}

export const RATE_LIMITS = {
  APP_SUBMISSION_PER_DEVELOPER: { limit: 5, windowSeconds: 60 * 60 }, // 5 submissions/hour/developer
  DOWNLOAD_PER_IDENTITY: { limit: 30, windowSeconds: 60 }, // 30 downloads/minute per user or IP
  REVIEW_PER_USER: { limit: 10, windowSeconds: 60 * 60 }, // 10 review writes/hour/user
  REPORT_PER_IDENTITY: { limit: 5, windowSeconds: 60 * 60 }, // 5 reports/hour per user or IP
  DEVICE_REGISTER_PER_USER: { limit: 10, windowSeconds: 60 * 60 }, // 10 device registrations/hour/user
  DEVICE_REGISTER_PER_IP: { limit: 20, windowSeconds: 60 * 60 }, // 20 device registrations/hour/IP
  IMEI_CHECK_PER_IP: { limit: 20, windowSeconds: 60 * 60 }, // 20 public IMEI checks/hour/IP
  IMEI_CHECK_PER_USER: { limit: 40, windowSeconds: 60 * 60 }, // 40 public IMEI checks/hour/signed-in user
  OWNERSHIP_CLAIM_SUBMIT_PER_USER: { limit: 10, windowSeconds: 60 * 60 }, // 10 claim submissions/hour/user
  OWNERSHIP_CLAIM_SUBMIT_PER_IP: { limit: 20, windowSeconds: 60 * 60 }, // 20 claim submissions/hour/IP
  OWNERSHIP_EVIDENCE_UPLOAD_PER_USER: { limit: 20, windowSeconds: 60 * 60 }, // 20 evidence uploads/hour/user
  DEVICE_REPORT_SUBMIT_PER_USER: { limit: 5, windowSeconds: 60 * 60 }, // 5 lost/stolen reports/hour/user
  DEVICE_REPORT_SUBMIT_PER_IP: { limit: 10, windowSeconds: 60 * 60 }, // 10 lost/stolen reports/hour/IP
  REPORT_EVIDENCE_UPLOAD_PER_USER: { limit: 20, windowSeconds: 60 * 60 }, // 20 report-evidence uploads/hour/user
  CERTIFICATE_ISSUE_PER_USER: { limit: 20, windowSeconds: 60 * 60 }, // 20 certificate issuances/hour/user
  CERTIFICATE_VERIFY_PER_IP: { limit: 30, windowSeconds: 60 * 60 }, // 30 certificate verifications/hour/IP
  BATCH_IMEI_CHECK_PER_USER: { limit: 10, windowSeconds: 60 * 60 }, // 10 batch calls/hour/user (each up to 20 IMEIs)
  BATCH_IMEI_CHECK_PER_IP: { limit: 15, windowSeconds: 60 * 60 }, // 15 batch calls/hour/IP
  SUBSCRIPTION_REQUEST_SUBMIT_PER_USER: { limit: 10, windowSeconds: 60 * 60 }, // 10 subscription requests/hour/dealer
};

// Hard cap on how many IMEIs one batch-check call may contain, independent
// of the hourly rate limit above -- this is what stops a single request from
// becoming a large synchronous load (spec: "لا تسمح للمستخدم الطبيعي أن يصنع
// load كبير"), regardless of how much of the hourly budget remains.
export const BATCH_IMEI_CHECK_MAX_ITEMS = 20;

// Progressive delay for the public IMEI-check endpoint: as usage climbs
// toward the hard rate-limit cutoff, add an increasing artificial delay
// before responding. This raises the cost of a scripted enumeration sweep
// (which cares about requests/second, not requests/hour) well before the
// hard limit kicks in, while staying invisible to a normal person typing
// a few IMEIs by hand. `used` is (limit - remaining) from checkRateLimit.
export async function applyProgressiveDelay(used: number): Promise<void> {
  let delayMs = 0;
  if (used >= 15) delayMs = 5000;
  else if (used >= 10) delayMs = 2000;
  else if (used >= 5) delayMs = 500;

  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
