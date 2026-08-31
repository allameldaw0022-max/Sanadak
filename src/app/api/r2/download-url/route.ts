import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, R2_BUCKET } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { appId } = await request.json().catch(() => ({ appId: "" }));

  if (typeof appId !== "string" || !appId) {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const supabase = await createClient();
  // RLS on `apps` already restricts visibility to approved apps (public),
  // or the owning developer / an admin — so a returned row means the
  // caller is allowed to see this app, and therefore to download its APK.
  const { data: app } = await supabase
    .from("apps")
    .select("apk_path")
    .eq("id", appId)
    .maybeSingle();

  if (!app?.apk_path) {
    return NextResponse.json({ error: "لا يوجد ملف APK لهذا التطبيق." }, { status: 404 });
  }

  const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: app.apk_path });
  const downloadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 60 });

  return NextResponse.json({ downloadUrl });
}
