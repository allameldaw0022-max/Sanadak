"use server";

import { createClient } from "@/lib/supabase/server";
import { logSecurityEvent } from "@/lib/security/audit";

// Called fire-and-forget from QrScannerPanel right after a scanned code
// passes extractCertificateIdFromScan and the one-shot scan guard, before
// navigating to /verify/[certificateId]. No certificate id, no raw scanned
// text, and no other scan content is ever passed in or logged here -- this
// only records that a QR scan produced a valid navigation, nothing about
// which certificate. Never throws: a logging failure must never affect the
// scanner's navigation flow.
export async function logQrScanUsedAction(): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await logSecurityEvent({
      eventType: "qr_scan_used",
      actorId: user?.id ?? null,
      actorRole: user ? "authenticated" : "anonymous",
    });
  } catch {
    // Best-effort logging only.
  }
}
