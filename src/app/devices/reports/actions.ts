"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { logSecurityEvent } from "@/lib/security/audit";
import { validateImageFile, IMAGE_CONTENT_TYPE, IMAGE_EXTENSION } from "@/lib/uploads/image-validation";
import type { Database } from "@/lib/supabase/database.types";

type DeviceReportType = Database["public"]["Enums"]["device_report_type"];

const GENERIC_REPORT_FAILURE = "تعذر تقديم البلاغ، حاول مرة أخرى لاحقًا.";
const EVIDENCE_BUCKET = "report-evidence";
const MAX_EVIDENCE_SIZE = 5 * 1024 * 1024;
const MAX_DETAILS_LENGTH = 1000;

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for") ?? "unknown";
}

export type SubmitReportResult = { ok: true; reportId: string } | { ok: false; error: string };

// A LOST/STOLEN report is only ever submitted by the device's own current
// owner, from their own device detail page -- device_id there is already
// safely known to them (getMyDeviceById is owner-scoped), so nothing new
// needs to resolve an IMEI to a device the way ownership claims do.
// device_reports_insert_own (Phase 1 RLS) only checks reporter_id =
// auth.uid(); the ownership check below is the actual business rule this
// action enforces, backed by RLS's own devices_select_own_or_admin/
// device_reports read policies for defense in depth.
export async function submitDeviceReportAction(input: {
  deviceId: string;
  reportType: DeviceReportType;
  details?: string | null;
}): Promise<SubmitReportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "يجب تسجيل الدخول أولًا." };

  if (input.reportType !== "LOST" && input.reportType !== "STOLEN") {
    return { ok: false, error: "نوع البلاغ غير صالح." };
  }

  const ip = await getClientIp();
  const [rateUser, rateIp] = await Promise.all([
    checkRateLimit(
      `device_report:user:${user.id}`,
      RATE_LIMITS.DEVICE_REPORT_SUBMIT_PER_USER.limit,
      RATE_LIMITS.DEVICE_REPORT_SUBMIT_PER_USER.windowSeconds
    ),
    checkRateLimit(
      `device_report:ip:${ip}`,
      RATE_LIMITS.DEVICE_REPORT_SUBMIT_PER_IP.limit,
      RATE_LIMITS.DEVICE_REPORT_SUBMIT_PER_IP.windowSeconds
    ),
  ]);
  if (!rateUser.allowed || !rateIp.allowed) {
    await logSecurityEvent({
      eventType: "device_report_rate_limited",
      actorId: user.id,
      actorRole: "authenticated",
    });
    return { ok: false, error: "لقد تجاوزت الحد المسموح به لتقديم البلاغات، حاول لاحقًا." };
  }

  const { data: device } = await supabase
    .from("devices")
    .select("id")
    .eq("id", input.deviceId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!device) return { ok: false, error: "هذا الجهاز غير موجود أو لا يخصك." };

  const details = (input.details ?? "").trim().slice(0, MAX_DETAILS_LENGTH) || null;

  const { data: report, error } = await supabase
    .from("device_reports")
    .insert({ device_id: device.id, reporter_id: user.id, report_type: input.reportType, details })
    .select("id")
    .single();

  if (error || !report) {
    await logSecurityEvent({
      eventType: "device_report_failed",
      actorId: user.id,
      actorRole: "authenticated",
      metadata: { device_id: device.id },
    });
    return { ok: false, error: GENERIC_REPORT_FAILURE };
  }

  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "report_submitted",
    title: "تم استلام بلاغك",
    body: "سنقوم بمراجعة البلاغ وإشعارك بأي تحديث.",
    related_table: "device_reports",
    related_id: report.id,
  });

  await logSecurityEvent({
    eventType: "device_report_submitted",
    actorId: user.id,
    actorRole: "authenticated",
    metadata: { device_id: device.id, report_id: report.id, report_type: input.reportType },
  });

  return { ok: true, reportId: report.id };
}

export type UploadReportEvidenceResult = { ok: true } | { ok: false; error: string };

// Same validated-upload pattern as submitClaimEvidenceAction (Section 7):
// real magic-byte content check, random filename, private folder-scoped
// bucket, append-only.
export async function submitReportEvidenceAction(reportId: string, file: File): Promise<UploadReportEvidenceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "يجب تسجيل الدخول أولًا." };

  const rate = await checkRateLimit(
    `report_evidence:user:${user.id}`,
    RATE_LIMITS.REPORT_EVIDENCE_UPLOAD_PER_USER.limit,
    RATE_LIMITS.REPORT_EVIDENCE_UPLOAD_PER_USER.windowSeconds
  );
  if (!rate.allowed) {
    await logSecurityEvent({
      eventType: "report_evidence_rate_limited",
      actorId: user.id,
      actorRole: "authenticated",
    });
    return { ok: false, error: "لقد تجاوزت الحد المسموح به لرفع الأدلة، حاول لاحقًا." };
  }

  const { data: report } = await supabase
    .from("device_reports")
    .select("id, status")
    .eq("id", reportId)
    .eq("reporter_id", user.id)
    .maybeSingle();

  if (!report) return { ok: false, error: "البلاغ غير موجود." };
  if (report.status === "APPROVED" || report.status === "REJECTED") {
    return { ok: false, error: "تم إغلاق هذا البلاغ، لا يمكن إضافة أدلة جديدة." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validated = validateImageFile(buffer, MAX_EVIDENCE_SIZE, "الدليل");
  if (!validated.ok) return { ok: false, error: validated.error };

  const path = `${user.id}/${randomUUID()}.${IMAGE_EXTENSION[validated.type]}`;
  const { error: uploadError } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(path, buffer, { contentType: IMAGE_CONTENT_TYPE[validated.type] });

  if (uploadError) {
    await logSecurityEvent({
      eventType: "report_evidence_upload_failed",
      actorId: user.id,
      actorRole: "authenticated",
      metadata: { report_id: reportId },
    });
    return { ok: false, error: "تعذر رفع الملف، حاول مرة أخرى." };
  }

  const { error: insertError } = await supabase.from("report_evidence").insert({
    report_id: reportId,
    uploader_id: user.id,
    storage_path: path,
  });

  if (insertError) {
    await supabase
      .storage.from(EVIDENCE_BUCKET)
      .remove([path])
      .catch(() => {});
    return { ok: false, error: "تعذر حفظ الدليل، حاول مرة أخرى." };
  }

  await logSecurityEvent({
    eventType: "report_evidence_uploaded",
    actorId: user.id,
    actorRole: "authenticated",
    metadata: { report_id: reportId },
  });

  return { ok: true };
}
