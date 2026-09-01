import { describe, expect, it } from "vitest";
import { evaluateSecurity, type SecurityRulesConfig } from "../risk-engine";
import type { ApkAnalysisResult } from "../apk-analyzer";
import type { MalwareScanResult } from "../malware-scanner";

const CONFIG: SecurityRulesConfig = {
  riskThresholds: { low: 20, medium: 50, high: 80 },
  highRiskPermissions: [
    "android.permission.READ_SMS",
    "android.permission.SEND_SMS",
    "android.permission.BIND_ACCESSIBILITY_SERVICE",
  ],
};

function baseAnalysis(overrides: Partial<ApkAnalysisResult> = {}): ApkAnalysisResult {
  return {
    isValidApk: true,
    invalidReason: null,
    hashes: { sha256: "a".repeat(64), sha1: "b".repeat(40), md5: "c".repeat(32) },
    fileSize: 1024,
    manifest: {
      packageName: "sd.example.app",
      versionName: "1.0.0",
      versionCode: "1",
      minSdk: 21,
      targetSdk: 34,
      permissions: [],
      activities: [],
      services: [],
      receivers: [],
      providers: [],
      exportedComponents: [],
      deepLinks: [],
    },
    certificate: {
      isSigned: true,
      fingerprintSha256: "cert-fingerprint-1",
      subject: "CN=Test",
      issuer: "CN=Test",
      validFrom: "2024-01-01T00:00:00.000Z",
      validTo: "2034-01-01T00:00:00.000Z",
      signatureScheme: "v1",
    },
    nativeLibraries: [],
    detectedUrls: [],
    structuralFindings: [],
    ...overrides,
  };
}

const CLEAN_MALWARE: MalwareScanResult = { status: "clean", provider: "virustotal", reportId: "x", details: null };
const NOT_CONFIGURED_MALWARE: MalwareScanResult = { status: "not_configured", provider: null, reportId: null, details: null };
const MALICIOUS_MALWARE: MalwareScanResult = { status: "malicious", provider: "virustotal", reportId: "x", details: null };

const NO_CONTEXT = { signatureChanged: false, duplicatePackageDifferentCert: false };

describe("evaluateSecurity", () => {
  it("passes a clean, signed, low-permission APK when malware scan is clean", () => {
    const result = evaluateSecurity(baseAnalysis(), CLEAN_MALWARE, CONFIG, NO_CONTEXT);
    expect(result.scanStatus).toBe("passed");
    expect(result.riskLevel).toBe("low");
  });

  it("never auto-passes when no malware provider is configured (fail-closed)", () => {
    const result = evaluateSecurity(baseAnalysis(), NOT_CONFIGURED_MALWARE, CONFIG, NO_CONTEXT);
    expect(result.scanStatus).toBe("review_required");
    expect(result.findings.some((f) => f.code === "malware_scan_not_configured")).toBe(true);
  });

  it("fails invalid/corrupted APKs outright", () => {
    const analysis = baseAnalysis({ isValidApk: false, invalidReason: "corrupted", manifest: null });
    const result = evaluateSecurity(analysis, NOT_CONFIGURED_MALWARE, CONFIG, NO_CONTEXT);
    expect(result.scanStatus).toBe("failed");
    expect(result.riskLevel).toBe("critical");
  });

  it("fails when a malware provider confirms malicious content", () => {
    const result = evaluateSecurity(baseAnalysis(), MALICIOUS_MALWARE, CONFIG, NO_CONTEXT);
    expect(result.scanStatus).toBe("failed");
    expect(result.findings.some((f) => f.code === "malware_confirmed")).toBe(true);
  });

  it("flags an unsigned APK for review rather than auto-passing", () => {
    const analysis = baseAnalysis({ certificate: { ...baseAnalysis().certificate, isSigned: false, signatureScheme: "unsigned" } });
    const result = evaluateSecurity(analysis, CLEAN_MALWARE, CONFIG, NO_CONTEXT);
    expect(result.scanStatus).toBe("review_required");
    expect(result.findings.some((f) => f.code === "unsigned_apk")).toBe(true);
  });

  it("sends a changed signing certificate to review, not an automatic rejection", () => {
    const result = evaluateSecurity(baseAnalysis(), CLEAN_MALWARE, CONFIG, {
      signatureChanged: true,
      duplicatePackageDifferentCert: false,
    });
    expect(result.scanStatus).toBe("review_required");
    expect(result.findings.some((f) => f.code === "signature_changed")).toBe(true);
  });

  it("sends a repackaged/impersonating package name (same name, different cert) to review", () => {
    const result = evaluateSecurity(baseAnalysis(), CLEAN_MALWARE, CONFIG, {
      signatureChanged: false,
      duplicatePackageDifferentCert: true,
    });
    expect(result.scanStatus).toBe("review_required");
    expect(result.findings.some((f) => f.code === "duplicate_package_different_cert")).toBe(true);
  });

  it("fails outright when the package name impersonates a well-known app", () => {
    const analysis = baseAnalysis({
      manifest: { ...baseAnalysis().manifest!, packageName: "com.whatsapp" },
    });
    const result = evaluateSecurity(analysis, CLEAN_MALWARE, CONFIG, NO_CONTEXT);
    expect(result.scanStatus).toBe("failed");
    expect(result.findings.some((f) => f.code === "known_package_impersonation")).toBe(true);
  });

  it("does not reject on a single low-severity signal alone", () => {
    const analysis = baseAnalysis({ detectedUrls: Array.from({ length: 40 }, (_, i) => `https://example.com/${i}`) });
    const result = evaluateSecurity(analysis, CLEAN_MALWARE, CONFIG, NO_CONTEXT);
    expect(result.scanStatus).toBe("passed");
  });

  it("sends high-risk permission combinations to review", () => {
    const analysis = baseAnalysis({
      manifest: {
        ...baseAnalysis().manifest!,
        permissions: [
          "android.permission.READ_SMS",
          "android.permission.SEND_SMS",
          "android.permission.BIND_ACCESSIBILITY_SERVICE",
        ],
      },
    });
    const result = evaluateSecurity(analysis, CLEAN_MALWARE, CONFIG, NO_CONTEXT);
    expect(result.scanStatus).toBe("review_required");
    expect(result.findings.some((f) => f.code === "high_risk_permissions")).toBe(true);
  });

  it("flags an exported content provider with no permission as high severity", () => {
    const analysis = baseAnalysis({
      manifest: {
        ...baseAnalysis().manifest!,
        providers: [{ name: ".LeakyProvider", exported: true, hasIntentFilter: false, permission: null }],
      },
    });
    const result = evaluateSecurity(analysis, CLEAN_MALWARE, CONFIG, NO_CONTEXT);
    expect(result.scanStatus).toBe("review_required");
    expect(result.findings.some((f) => f.code === "exported_provider_unprotected")).toBe(true);
  });

  it("flags suspicious zip structure (path traversal entries) as critical", () => {
    const analysis = baseAnalysis({ structuralFindings: ["zip_path_traversal_entries"] });
    const result = evaluateSecurity(analysis, CLEAN_MALWARE, CONFIG, NO_CONTEXT);
    expect(result.scanStatus).toBe("failed");
    expect(result.findings.some((f) => f.code === "zip_path_traversal")).toBe(true);
  });
});
