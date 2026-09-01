import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Service-role client: bypasses RLS entirely. Used ONLY from trusted
// server-side code (Server Actions / Route Handlers) that has already
// verified the caller's identity and ownership itself — never imported by
// client components, never exposed to the browser. This is what lets the
// security-scan pipeline write apk_security_scans / security_events /
// apps.security_status even though those columns are intentionally
// unwritable through the normal RLS-governed, user-session client.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY غير مهيأ على الخادم.");
  }
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
