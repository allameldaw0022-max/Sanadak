import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, R2_BUCKET } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const { fileName } = await request.json().catch(() => ({ fileName: "" }));

  if (typeof fileName !== "string" || !fileName.toLowerCase().endsWith(".apk")) {
    return NextResponse.json({ error: "الملف يجب أن يكون بصيغة APK." }, { status: 400 });
  }

  const key = `${user.id}/${randomUUID()}.apk`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: "application/vnd.android.package-archive",
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 300 });

  return NextResponse.json({ uploadUrl, key });
}
