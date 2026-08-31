import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
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

  const { key } = await request.json().catch(() => ({ key: "" }));

  // Keys are namespaced by uploader id (`${user.id}/...`), so this also
  // prevents a developer from deleting another developer's object.
  if (typeof key !== "string" || !key.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  await getR2Client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));

  return NextResponse.json({ ok: true });
}
