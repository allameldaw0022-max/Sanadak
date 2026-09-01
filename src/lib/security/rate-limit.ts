import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

// Fixed-window counter backed by security_rate_limits (service-role only,
// no RLS policy grants it to anon/authenticated at all). Works across
// serverless invocations, unlike an in-memory counter.
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createServiceClient();
  const now = new Date();

  const { data: existing } = await supabase
    .from("security_rate_limits")
    .select("window_start, count")
    .eq("key", key)
    .maybeSingle();

  if (!existing || now.getTime() - new Date(existing.window_start).getTime() > windowSeconds * 1000) {
    await supabase
      .from("security_rate_limits")
      .upsert({ key, window_start: now.toISOString(), count: 1 });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await supabase
    .from("security_rate_limits")
    .update({ count: existing.count + 1 })
    .eq("key", key);

  return { allowed: true, remaining: limit - existing.count - 1 };
}

export const RATE_LIMITS = {
  APP_SUBMISSION_PER_DEVELOPER: { limit: 5, windowSeconds: 60 * 60 }, // 5 submissions/hour/developer
  DOWNLOAD_PER_IDENTITY: { limit: 30, windowSeconds: 60 }, // 30 downloads/minute per user or IP
  REVIEW_PER_USER: { limit: 10, windowSeconds: 60 * 60 }, // 10 review writes/hour/user
  REPORT_PER_IDENTITY: { limit: 5, windowSeconds: 60 * 60 }, // 5 reports/hour per user or IP
};
