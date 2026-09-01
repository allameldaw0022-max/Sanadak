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
  | "rate_limited";

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
