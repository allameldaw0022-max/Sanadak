"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { runSecurityScan } from "@/lib/security/run-scan";
import { logSecurityEvent } from "@/lib/security/audit";
import { validateImageFile, IMAGE_CONTENT_TYPE, IMAGE_EXTENSION } from "@/lib/uploads/image-validation";

const MAX_APK_SIZE = 50 * 1024 * 1024;
const MAX_ICON_SIZE = 2 * 1024 * 1024;
const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024;
const MAX_SCREENSHOTS = 5;
const ICON_BUCKET = "app-icons";

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
// keeps working exactly as before) — but the APK is re-fetched from R2 and
// statically analyzed HERE, server-side, before the app can ever become
// publicly visible, and the icon/screenshots the developer picked are
// validated by their real bytes (never by filename/MIME the browser sent)
// and uploaded server-side too. Nothing about the security verdict, or
// what an uploaded "image" actually is, is trusted from the client.
export async function submitNewAppAction(input: {
  name: string;
  description: string;
  categorySlug: string;
  version: string;
  size: string;
  apkPath: string;
  iconFile: File | null;
  screenshotFiles: File[];
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

  if (input.screenshotFiles.length > MAX_SCREENSHOTS) {
    return { ok: false, error: `لا يمكن رفع أكثر من ${MAX_SCREENSHOTS} لقطات شاشة.` };
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

  // --- Validate the icon and every screenshot by real file content before
  // uploading anything at all, so an invalid file never leaves an orphan.
  let iconValidated: { buffer: Buffer; type: keyof typeof IMAGE_CONTENT_TYPE } | null = null;
  if (input.iconFile) {
    const buf = Buffer.from(await input.iconFile.arrayBuffer());
    const result = validateImageFile(buf, MAX_ICON_SIZE, "شعار التطبيق");
    if (!result.ok) return { ok: false, error: result.error };
    iconValidated = { buffer: buf, type: result.type };
  }

  const screenshotsValidated: { buffer: Buffer; type: keyof typeof IMAGE_CONTENT_TYPE }[] = [];
  for (const [i, file] of input.screenshotFiles.entries()) {
    const buf = Buffer.from(await file.arrayBuffer());
    const result = validateImageFile(buf, MAX_SCREENSHOT_SIZE, `لقطة الشاشة ${i + 1}`);
    if (!result.ok) return { ok: false, error: result.error };
    screenshotsValidated.push({ buffer: buf, type: result.type });
  }

  // --- Upload validated images to Storage (own-folder-scoped by RLS,
  // matching the same {userId}/... ownership pattern already used for APKs
  // in R2). Track what we've written so we can clean up on any later
  // failure — no orphaned files left behind.
  const uploadedIconPath: string[] = [];
  const uploadedScreenshotPaths: string[] = [];

  async function cleanupUploadedImages() {
    const paths = [...uploadedIconPath, ...uploadedScreenshotPaths];
    if (paths.length > 0) {
      await supabase.storage.from(ICON_BUCKET).remove(paths).catch(() => {});
    }
  }

  let iconPath: string | null = null;
  if (iconValidated) {
    const path = `${user.id}/icon-${randomUUID()}.${IMAGE_EXTENSION[iconValidated.type]}`;
    const { error: uploadError } = await supabase.storage
      .from(ICON_BUCKET)
      .upload(path, iconValidated.buffer, { contentType: IMAGE_CONTENT_TYPE[iconValidated.type] });
    if (uploadError) {
      return { ok: false, error: "تعذر رفع شعار التطبيق، حاول مرة أخرى." };
    }
    uploadedIconPath.push(path);
    iconPath = path;
  }

  const screenshotPaths: string[] = [];
  for (const shot of screenshotsValidated) {
    const path = `${user.id}/screenshot-${randomUUID()}.${IMAGE_EXTENSION[shot.type]}`;
    const { error: uploadError } = await supabase.storage
      .from(ICON_BUCKET)
      .upload(path, shot.buffer, { contentType: IMAGE_CONTENT_TYPE[shot.type] });
    if (uploadError) {
      await cleanupUploadedImages();
      return { ok: false, error: "تعذر رفع إحدى لقطات الشاشة، حاول مرة أخرى." };
    }
    uploadedScreenshotPaths.push(path);
    screenshotPaths.push(path);
  }

  let buffer: Buffer;
  try {
    const obj = await getR2Client().send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: input.apkPath }));
    const bytes = await obj.Body?.transformToByteArray();
    if (!bytes || bytes.length === 0) throw new Error("empty");
    if (bytes.length > MAX_APK_SIZE) {
      await getR2Client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: input.apkPath }));
      await cleanupUploadedImages();
      return { ok: false, error: "حجم ملف APK يتجاوز الحد المسموح به." };
    }
    buffer = Buffer.from(bytes);
  } catch {
    await cleanupUploadedImages();
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
      icon_path: iconPath,
    })
    .select("id")
    .single();

  if (insertError || !appRow) {
    await getR2Client()
      .send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: input.apkPath }))
      .catch(() => {});
    await cleanupUploadedImages();
    return {
      ok: false,
      error: insertError?.message.includes("row-level security")
        ? "تعذر إرسال التطبيق: تجاوزت الحد المسموح به في خطة اشتراكك أو انتهى اشتراكك."
        : "تعذر إرسال التطبيق للمراجعة، حاول مرة أخرى.",
    };
  }

  if (screenshotPaths.length > 0) {
    const { error: screenshotsError } = await supabase.from("app_screenshots").insert(
      screenshotPaths.map((storage_path, index) => ({
        app_id: appRow.id,
        developer_id: user.id,
        storage_path,
        sort_order: index,
      }))
    );
    // The app itself was already created successfully; a failure here only
    // drops the screenshot gallery, not the whole submission. Clean up the
    // now-unlinked screenshot files so nothing is orphaned in storage.
    if (screenshotsError) {
      await supabase.storage.from(ICON_BUCKET).remove(uploadedScreenshotPaths).catch(() => {});
    }
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
