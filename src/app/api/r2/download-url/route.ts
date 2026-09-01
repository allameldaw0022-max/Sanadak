import { NextResponse } from "next/server";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, R2_BUCKET } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { logSecurityEvent } from "@/lib/security/audit";

export async function POST(request: Request) {
  const { appId } = await request.json().catch(() => ({ appId: "" }));

  if (typeof appId !== "string" || !appId) {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateKey = user ? `download:user:${user.id}` : `download:ip:${request.headers.get("x-forwarded-for") ?? "unknown"}`;
  const rate = await checkRateLimit(
    rateKey,
    RATE_LIMITS.DOWNLOAD_PER_IDENTITY.limit,
    RATE_LIMITS.DOWNLOAD_PER_IDENTITY.windowSeconds
  );
  if (!rate.allowed) {
    return NextResponse.json({ error: "عدد كبير جدًا من طلبات التحميل، حاول لاحقًا." }, { status: 429 });
  }

  // RLS on `apps` already restricts visibility to (approved AND security-
  // passed AND not emergency-disabled) for the public, or the owning
  // developer / an admin regardless of status — so a returned row means
  // the caller is allowed to see this app. We still re-check explicitly
  // below for anyone who isn't the owner/admin, as defense in depth.
  const { data: app } = await supabase
    .from("apps")
    .select("apk_path, apk_md5, developer_id, security_status, emergency_disabled")
    .eq("id", appId)
    .maybeSingle();

  if (!app?.apk_path) {
    return NextResponse.json({ error: "لا يوجد ملف APK لهذا التطبيق." }, { status: 404 });
  }

  const isOwnerOrAdmin = user?.id === app.developer_id || (await isAdmin(supabase, user?.id));
  if (!isOwnerOrAdmin && (app.security_status !== "passed" || app.emergency_disabled)) {
    await logSecurityEvent({
      eventType: "download_blocked",
      actorId: user?.id ?? null,
      appId,
      metadata: { reason: "security_status_not_passed_or_disabled" },
    });
    return NextResponse.json({ error: "هذا التطبيق غير متاح للتحميل حاليًا." }, { status: 403 });
  }

  // Tamper check: if we have a recorded hash from the approved scan,
  // confirm the object currently stored under this key hasn't been
  // swapped since approval before ever handing out a download link. For a
  // single (non-multipart) PUT upload — which is how this app always
  // uploads — R2/S3's ETag is the object's MD5 hex, so this needs no
  // extra full-file download on every request.
  if (app.apk_md5) {
    try {
      const head = await getR2Client().send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: app.apk_path }));
      const currentMd5 = (head.ETag ?? "").replace(/"/g, "").toLowerCase();
      if (currentMd5 && currentMd5 !== app.apk_md5.toLowerCase()) {
        await logSecurityEvent({
          eventType: "download_blocked",
          actorId: user?.id ?? null,
          appId,
          metadata: { reason: "file_hash_mismatch_since_approval" },
        });
        return NextResponse.json(
          { error: "تم رصد تغيّر في ملف APK بعد اعتماده، تم إيقاف التحميل لأسباب أمنية." },
          { status: 409 }
        );
      }
    } catch {
      // If the HEAD check itself fails, fall through and still serve the
      // signed URL rather than breaking downloads over a transient error.
    }
  }

  const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: app.apk_path });
  const downloadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 60 });

  await logSecurityEvent({ eventType: "download_issued", actorId: user?.id ?? null, appId });

  return NextResponse.json({ downloadUrl });
}

async function isAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | undefined
): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin";
}
