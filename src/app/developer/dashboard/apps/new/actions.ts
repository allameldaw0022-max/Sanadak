"use server";

import { revalidatePath } from "next/cache";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { runSecurityScan } from "@/lib/security/run-scan";
import { logSecurityEvent } from "@/lib/security/audit";

const MAX_APK_SIZE = 50 * 1024 * 1024;

export type SubmitAppResult = { ok: true; appId: string } | { ok: false; error: string };

function slugify(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "app"}-${Math.random().toString(36).slice(2, 8)}`;
}

// Replaces the previous client-side `supabase.from('apps').insert(...)`.
// The app row is still inserted through the developer's own RLS-governed
// session (so subscription-limit enforcement via developer_can_add_app
// keeps working exactly as before) — but the APK is now re-fetched from R2
// and statically analyzed HERE, server-side, before the app can ever
// become publicly visible. Nothing about the security verdict is trusted
// from the client: the developer only ever supplies the R2 key of a file
// they already uploaded, never a scan result.
export async function submitNewAppAction(input: {
  name: string;
  description: string;
  categorySlug: string;
  version: string;
  size: string;
  apkPath: string;
}): Promise<SubmitAppResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "يجب تسجيل الدخول أولًا." };

  // Keys are namespaced by uploader id — this also stops a developer from
  // pointing this action at another developer's already-uploaded object.
  if (typeof input.apkPath !== "string" || !input.apkPath.startsWith(`${user.id}/`)) {
    return { ok: false, error: "طلب غير صالح." };
  }

  const rate = await checkRateLimit(
    `app_submit:${user.id}`,
    RATE_LIMITS.APP_SUBMISSION_PER_DEVELOPER.limit,
    RATE_LIMITS.APP_SUBMISSION_PER_DEVELOPER.windowSeconds
  );
  if (!rate.allowed) {
    await logSecurityEvent({
      eventType: "rate_limited",
      actorId: user.id,
      actorRole: "developer",
      metadata: { action: "app_submit" },
    });
    return { ok: false, error: "لقد تجاوزت الحد المسموح به لعدد التطبيقات المُرسلة خلال ساعة، حاول لاحقًا." };
  }

  let buffer: Buffer;
  try {
    const obj = await getR2Client().send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: input.apkPath }));
    const bytes = await obj.Body?.transformToByteArray();
    if (!bytes || bytes.length === 0) throw new Error("empty");
    if (bytes.length > MAX_APK_SIZE) {
      await getR2Client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: input.apkPath }));
      return { ok: false, error: "حجم ملف APK يتجاوز الحد المسموح به." };
    }
    buffer = Buffer.from(bytes);
  } catch {
    return { ok: false, error: "تعذر قراءة ملف APK من التخزين، حاول رفعه مرة أخرى." };
  }

  const slug = slugify(input.name);
  const shortDescription =
    input.description.length > 140 ? `${input.description.slice(0, 137)}...` : input.description;

  const { data: appRow, error: insertError } = await supabase
    .from("apps")
    .insert({
      slug,
      name: input.name,
      developer_id: user.id,
      category_slug: input.categorySlug,
      short_description: shortDescription,
      description: input.description,
      version: input.version,
      size: input.size,
      apk_path: input.apkPath,
    })
    .select("id")
    .single();

  if (insertError || !appRow) {
    await getR2Client()
      .send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: input.apkPath }))
      .catch(() => {});
    return {
      ok: false,
      error: insertError?.message.includes("row-level security")
        ? "تعذر إرسال التطبيق: تجاوزت الحد المسموح به في خطة اشتراكك أو انتهى اشتراكك."
        : "تعذر إرسال التطبيق للمراجعة، حاول مرة أخرى.",
    };
  }

  try {
    await runSecurityScan({ appId: appRow.id, developerId: user.id, filePath: input.apkPath, buffer });
  } catch {
    // The app row already defaults to security_status='pending_scan',
    // which the RLS policy on `apps` treats as not publicly visible — so a
    // scan pipeline failure fails closed rather than silently publishing.
  }

  revalidatePath("/developer/dashboard");
  return { ok: true, appId: appRow.id };
}
