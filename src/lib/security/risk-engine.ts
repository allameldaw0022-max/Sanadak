import type { ApkAnalysisResult } from "./apk-analyzer";
import type { MalwareScanResult } from "./malware-scanner";

export type FindingSeverity = "low" | "medium" | "high" | "critical";
export type Finding = { code: string; severity: FindingSeverity; message: string };

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ScanDecisionStatus = "passed" | "failed" | "review_required";

export type SecurityRulesConfig = {
  riskThresholds: { low: number; medium: number; high: number };
  highRiskPermissions: string[];
};

export type RiskEvaluation = {
  riskScore: number;
  riskLevel: RiskLevel;
  scanStatus: ScanDecisionStatus;
  findings: Finding[];
};

// Package names of well-known apps: Sanadak is a third-party store, so a
// submission using one of these exact package names is not that app's
// real publisher and is very likely an impersonation/repackaging attempt.
const KNOWN_PACKAGE_NAMES = new Set([
  "com.whatsapp",
  "com.facebook.katana",
  "com.instagram.android",
  "org.telegram.messenger",
  "com.google.android.gm",
  "com.google.android.apps.maps",
  "com.android.chrome",
  "com.google.android.youtube",
  "com.twitter.android",
  "com.snapchat.android",
  "com.spotify.music",
  "com.netflix.mediaclient",
  "com.ubercab",
  "com.paypal.android.p2pmobile",
]);

export function evaluateSecurity(
  analysis: ApkAnalysisResult,
  malware: MalwareScanResult,
  config: SecurityRulesConfig,
  context: { signatureChanged: boolean; duplicatePackageDifferentCert: boolean }
): RiskEvaluation {
  const findings: Finding[] = [];

  if (!analysis.isValidApk) {
    return {
      riskScore: 100,
      riskLevel: "critical",
      scanStatus: "failed",
      findings: [
        { code: "invalid_apk", severity: "critical", message: analysis.invalidReason ?? "ملف APK غير صالح." },
      ],
    };
  }

  if (analysis.structuralFindings.includes("zip_path_traversal_entries")) {
    findings.push({
      code: "zip_path_traversal",
      severity: "critical",
      message: "الأرشيف يحتوي على مسارات ملفات مشبوهة (محاولة إفلات من مجلد الاستخراج).",
    });
  }
  if (analysis.structuralFindings.includes("high_compression_ratio_entry")) {
    findings.push({
      code: "high_compression_ratio",
      severity: "high",
      message: "أحد الملفات داخل الأرشيف له نسبة ضغط غير معتادة (مؤشر ضغط تفجيري محتمل).",
    });
  }
  if (
    analysis.structuralFindings.includes("manifest_unparseable") ||
    analysis.structuralFindings.includes("manifest_unreadable")
  ) {
    findings.push({
      code: "manifest_unparseable",
      severity: "high",
      message: "تعذر تحليل AndroidManifest.xml بشكل كامل.",
    });
  }

  if (!analysis.certificate.isSigned) {
    findings.push({ code: "unsigned_apk", severity: "high", message: "ملف APK غير موقّع رقميًا." });
  }

  if (context.signatureChanged) {
    findings.push({
      code: "signature_changed",
      severity: "high",
      message: "توقيع النسخة الجديدة مختلف عن النسخة السابقة.",
    });
  }
  if (context.duplicatePackageDifferentCert) {
    findings.push({
      code: "duplicate_package_different_cert",
      severity: "high",
      message: "اسم الحزمة (package name) مطابق لتطبيق آخر منشور بتوقيع مختلف تمامًا — احتمال محاكاة أو انتحال.",
    });
  }

  const packageName = analysis.manifest?.packageName ?? null;
  if (packageName && KNOWN_PACKAGE_NAMES.has(packageName)) {
    findings.push({
      code: "known_package_impersonation",
      severity: "critical",
      message: `اسم الحزمة (${packageName}) يطابق تطبيقًا عالميًا معروفًا — هذا مؤشر قوي جدًا على انتحال هوية تطبيق آخر.`,
    });
  }

  const permissions = analysis.manifest?.permissions ?? [];
  const highRiskPermsFound = permissions.filter((p) => config.highRiskPermissions.includes(p));
  if (highRiskPermsFound.length > 0) {
    findings.push({
      code: "high_risk_permissions",
      severity: highRiskPermsFound.length >= 3 ? "high" : "medium",
      message: `صلاحيات حساسة مطلوبة: ${highRiskPermsFound.join(", ")}`,
    });
  }

  const exportedProvidersNoPermission = (analysis.manifest?.providers ?? []).filter(
    (p) => p.exported === true && !p.permission
  );
  if (exportedProvidersNoPermission.length > 0) {
    findings.push({
      code: "exported_provider_unprotected",
      severity: "high",
      message: "يوجد Content Provider مُصدَّر (exported) بدون صلاحية حماية — احتمال تسريب بيانات.",
    });
  }

  const exportedCount = analysis.manifest?.exportedComponents.length ?? 0;
  if (exportedCount > 5) {
    findings.push({
      code: "many_exported_components",
      severity: "medium",
      message: `عدد كبير من المكوّنات المُصدَّرة (exported): ${exportedCount}.`,
    });
  }

  if (analysis.detectedUrls.length > 30) {
    findings.push({
      code: "many_embedded_urls",
      severity: "low",
      message: `عدد كبير من الروابط داخل الملف التنفيذي: ${analysis.detectedUrls.length}.`,
    });
  }

  // Malware verdict
  if (malware.status === "malicious") {
    findings.push({
      code: "malware_confirmed",
      severity: "critical",
      message: "مزود فحص Malware أبلغ عن اكتشاف برمجية ضارة مؤكدة.",
    });
  } else if (malware.status === "suspicious") {
    findings.push({
      code: "malware_suspicious",
      severity: "high",
      message: "مزود فحص Malware صنّف الملف كمشبوه.",
    });
  } else if (malware.status === "not_configured") {
    findings.push({
      code: "malware_scan_not_configured",
      severity: "high",
      message: "لم يتم إجراء فحص Malware خارجي.",
    });
  } else if (malware.status === "pending") {
    findings.push({
      code: "malware_scan_pending",
      severity: "high",
      message: "لا يوجد تقرير Malware سابق لهذا الملف بعد — بانتظار مراجعة يدوية أو فحص لاحق.",
    });
  } else if (malware.status === "error") {
    findings.push({
      code: "malware_scan_error",
      severity: "high",
      message: "تعذر إتمام فحص Malware الخارجي بسبب خطأ فني.",
    });
  }

  const weights: Record<FindingSeverity, number> = { critical: 100, high: 25, medium: 10, low: 4 };
  const riskScore = Math.min(
    100,
    findings.reduce((sum, f) => sum + weights[f.severity], 0)
  );

  const { low, medium, high } = config.riskThresholds;
  const riskLevel: RiskLevel =
    riskScore <= low ? "low" : riskScore <= medium ? "medium" : riskScore <= high ? "high" : "critical";

  const hasCritical = findings.some((f) => f.severity === "critical");
  const hasHigh = findings.some((f) => f.severity === "high");

  // Risk score alone never rejects a legitimate app on a single weak
  // signal (per policy) — the pass/review/fail decision is driven by
  // finding severity, the score is the advisory summary shown to admins.
  const scanStatus: ScanDecisionStatus = hasCritical ? "failed" : hasHigh ? "review_required" : "passed";

  return { riskScore, riskLevel, scanStatus, findings };
}
