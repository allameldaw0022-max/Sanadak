import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/supabase/database.types";

export type SecurityEventType =
  | "apk_uploaded"
  | "scan_started"
  | "scan_completed"
  | "scan_failed"
  | "security_passed"
  | "security_failed"
  | "security_review_required"
  | "admin_reviewed"
  | "security_approved"
  | "security_rejected"
  | "emergency_disabled"
  | "emergency_reenabled"
  | "download_blocked"
  | "download_issued"
  | "signature_changed_detected"
  | "rate_limited"
  | "device_registered"
  | "device_registration_failed"
  | "device_registration_rate_limited"
  | "imei_check"
  | "imei_check_rate_limited"
  | "ownership_claim_submitted"
  | "ownership_claim_failed"
  | "ownership_claim_rate_limited"
  | "ownership_evidence_uploaded"
  | "ownership_evidence_upload_failed"
  | "ownership_evidence_rate_limited"
  | "device_report_submitted"
  | "device_report_failed"
  | "device_report_rate_limited"
  | "report_evidence_uploaded"
  | "report_evidence_upload_failed"
  | "report_evidence_rate_limited"
  | "certificate_issued"
  | "certificate_issue_failed"
  | "certificate_verified"
  | "qr_scan_used"
  | "batch_imei_check"
  | "batch_imei_check_rate_limited"
  | "subscription_request_submitted"
  | "subscription_request_failed"
  | "subscription_request_rate_limited"
  | "subscription_request_reviewed";

// Append-only audit trail. Never pass password/secret values in metadata —
// callers must only pass non-sensitive, already-computed scan/report data.
export async function logSecurityEvent(params: {
  eventType: SecurityEventType;
  actorId?: string | null;
  actorRole?: string | null;
  appId?: string | null;
  scanId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createServiceClient();
  await supabase.from("security_events").insert({
    event_type: params.eventType,
    actor_id: params.actorId ?? null,
    actor_role: params.actorRole ?? null,
    app_id: params.appId ?? null,
    scan_id: params.scanId ?? null,
    metadata: (params.metadata ?? {}) as Json,
  });
}
