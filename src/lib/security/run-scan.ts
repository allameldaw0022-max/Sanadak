import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/supabase/database.types";
import { analyzeApk } from "./apk-analyzer";
import { getMalwareScanner } from "./malware-scanner";
import { evaluateSecurity, type SecurityRulesConfig } from "./risk-engine";
import { logSecurityEvent } from "./audit";

const DEFAULT_RULES_CONFIG: SecurityRulesConfig = {
  riskThresholds: { low: 20, medium: 50, high: 80 },
  highRiskPermissions: [
    "android.permission.READ_SMS",
    "android.permission.SEND_SMS",
    "android.permission.RECEIVE_SMS",
    "android.permission.CALL_PHONE",
    "android.permission.PROCESS_OUTGOING_CALLS",
    "android.permission.BIND_ACCESSIBILITY_SERVICE",
    "android.permission.BIND_DEVICE_ADMIN",
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.REQUEST_INSTALL_PACKAGES",
    "android.permission.WRITE_SECURE_SETTINGS",
    "android.permission.READ_CALL_LOG",
    "android.permission.WRITE_CALL_LOG",
  ],
};

export type RunScanResult = {
  scanId: string;
  scanStatus: "passed" | "failed" | "review_required";
  riskScore: number;
};

export async function runSecurityScan(params: {
  appId: string;
  developerId: string;
  filePath: string;
  buffer: Buffer;
}): Promise<RunScanResult> {
  const supabase = createServiceClient();

  await logSecurityEvent({
    eventType: "apk_uploaded",
    actorId: params.developerId,
    actorRole: "developer",
    appId: params.appId,
    metadata: { filePath: params.filePath, fileSize: params.buffer.length },
  });
  await logSecurityEvent({ eventType: "scan_started", appId: params.appId });

  const analysis = await analyzeApk(params.buffer);
  const packageName = analysis.manifest?.packageName ?? null;

  // Compare against this app's own previous passed scan (version update).
  const { data: previousOwnScan } = await supabase
    .from("apk_security_scans")
    .select("certificate_fingerprint")
    .eq("app_id", params.appId)
    .eq("scan_status", "passed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const signatureChanged = Boolean(
    previousOwnScan?.certificate_fingerprint &&
      analysis.certificate.fingerprintSha256 &&
      previousOwnScan.certificate_fingerprint !== analysis.certificate.fingerprintSha256
  );

  // Compare against ANY other app using the same package name (repackaging
  // / impersonation of an unrelated developer's published app).
  let duplicatePackageDifferentCert = false;
  if (packageName) {
    const { data: otherAppScan } = await supabase
      .from("apk_security_scans")
      .select("certificate_fingerprint, app_id")
      .eq("package_name", packageName)
      .neq("app_id", params.appId)
      .eq("scan_status", "passed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    duplicatePackageDifferentCert = Boolean(
      otherAppScan?.certificate_fingerprint &&
        analysis.certificate.fingerprintSha256 &&
        otherAppScan.certificate_fingerprint !== analysis.certificate.fingerprintSha256
    );
  }

  const malware = analysis.isValidApk
    ? await getMalwareScanner().scanByHash(analysis.hashes.sha256)
    : { status: "error" as const, provider: null, reportId: null, details: null };

  const { data: rulesRow } = await supabase.from("security_rules_config").select("config").maybeSingle();
  const config = (rulesRow?.config as SecurityRulesConfig | undefined) ?? DEFAULT_RULES_CONFIG;

  const evaluation = evaluateSecurity(analysis, malware, config, {
    signatureChanged,
    duplicatePackageDifferentCert,
  });

  const { data: inserted, error: insertError } = await supabase
    .from("apk_security_scans")
    .insert({
      app_id: params.appId,
      developer_id: params.developerId,
      file_path: params.filePath,
      sha256: analysis.hashes.sha256,
      sha1: analysis.hashes.sha1,
      md5: analysis.hashes.md5,
      file_size: analysis.fileSize,
      package_name: packageName,
      version_name: analysis.manifest?.versionName ?? null,
      version_code: analysis.manifest?.versionCode ?? null,
      min_sdk: analysis.manifest?.minSdk ?? null,
      target_sdk: analysis.manifest?.targetSdk ?? null,
      is_signed: analysis.certificate.isSigned,
      certificate_fingerprint: analysis.certificate.fingerprintSha256,
      certificate_subject: analysis.certificate.subject,
      certificate_issuer: analysis.certificate.issuer,
      certificate_valid_from: analysis.certificate.validFrom,
      certificate_valid_to: analysis.certificate.validTo,
      signature_scheme: analysis.certificate.signatureScheme,
      signature_changed: signatureChanged,
      previous_certificate_fingerprint: previousOwnScan?.certificate_fingerprint ?? null,
      permissions: analysis.manifest?.permissions ?? [],
      activities: analysis.manifest?.activities ?? [],
      services: analysis.manifest?.services ?? [],
      receivers: analysis.manifest?.receivers ?? [],
      providers: analysis.manifest?.providers ?? [],
      exported_components: analysis.manifest?.exportedComponents ?? [],
      deep_links: analysis.manifest?.deepLinks ?? [],
      native_libraries: analysis.nativeLibraries,
      detected_urls: analysis.detectedUrls,
      risk_score: evaluation.riskScore,
      risk_level: evaluation.riskLevel,
      malware_status: malware.status,
      malware_provider: malware.provider,
      malware_report_id: malware.reportId,
      malware_details: malware.details as Json,
      findings: evaluation.findings,
      scan_status: evaluation.scanStatus,
      is_valid_apk: analysis.isValidApk,
      invalid_reason: analysis.invalidReason,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    await logSecurityEvent({
      eventType: "scan_failed",
      appId: params.appId,
      metadata: { error: insertError?.message ?? "unknown" },
    });
    throw new Error("تعذر حفظ نتيجة الفحص الأمني.");
  }

  await supabase
    .from("apps")
    .update({
      security_status: evaluation.scanStatus,
      apk_sha256: analysis.hashes.sha256,
      apk_sha1: analysis.hashes.sha1,
      apk_md5: analysis.hashes.md5,
      security_scan_id: inserted.id,
    })
    .eq("id", params.appId);

  await logSecurityEvent({
    eventType: "scan_completed",
    appId: params.appId,
    scanId: inserted.id,
    metadata: { scanStatus: evaluation.scanStatus, riskScore: evaluation.riskScore },
  });
  await logSecurityEvent({
    eventType:
      evaluation.scanStatus === "passed"
        ? "security_passed"
        : evaluation.scanStatus === "failed"
          ? "security_failed"
          : "security_review_required",
    appId: params.appId,
    scanId: inserted.id,
  });

  return { scanId: inserted.id, scanStatus: evaluation.scanStatus, riskScore: evaluation.riskScore };
}
