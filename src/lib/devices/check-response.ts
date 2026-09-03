import type { Database } from "@/lib/supabase/database.types";

type DeviceStatus = Database["public"]["Enums"]["device_status"];

// Every disclosed status other than BLOCKED. BLOCKED is deliberately not a
// key of this map -- see buildImeiCheckResponse below.
const DISCLOSED_STATUS_MESSAGES: Record<Exclude<DeviceStatus, "BLOCKED">, string> = {
  ACTIVE: "الجهاز مسجل وحالته سليمة حاليًا.",
  UNDER_REVIEW: "الجهاز قيد المراجعة.",
  LOST: "تم الإبلاغ عن الجهاز كمفقود.",
  STOLEN: "تم الإبلاغ عن الجهاز كمسروق.",
  RECOVERED: "الجهاز مسجل كجهاز مستعاد.",
};

// The exact set of statuses public_check_device_status() itself will ever
// attach a masked owner name to (see the migration adding
// owner_display_name) -- repeated here as a second, independent gate so a
// bug in either layer alone still can't surface a name for LOST/STOLEN/
// BLOCKED: this function only ever reads owner_display_name at all when
// status is in this set.
const OWNER_NAME_ELIGIBLE_STATUSES = new Set<DeviceStatus>(["ACTIVE", "UNDER_REVIEW", "RECOVERED"]);

const NOT_DISCLOSED_MESSAGE = "تعذر إظهار نتيجة التحقق.";

export type ImeiCheckDisclosure =
  | { disclosed: true; status: Exclude<DeviceStatus, "BLOCKED">; message: string; ownerDisplayName: string | null }
  | { disclosed: false; message: string };

// Maps a raw DB lookup result to the public-facing response shape. This is
// the single place that decides what a stranger is allowed to learn from an
// IMEI check. ownerDisplayName is already masked by the database (never the
// full name) and already NULL for any status this function wouldn't
// disclose anyway -- the OWNER_NAME_ELIGIBLE_STATUSES check below is
// defense-in-depth, not the only thing standing between a caller and a name.
//
// "not found" and "BLOCKED" resolve to the exact same {disclosed:false,
// message} shape on purpose: an attacker must not be able to tell an
// unregistered IMEI apart from one that exists but is deliberately hidden.
export function buildImeiCheckDisclosure(
  status: DeviceStatus | null,
  ownerDisplayName: string | null
): ImeiCheckDisclosure {
  if (status === null || status === "BLOCKED") {
    return { disclosed: false, message: NOT_DISCLOSED_MESSAGE };
  }
  return {
    disclosed: true,
    status,
    message: DISCLOSED_STATUS_MESSAGES[status],
    ownerDisplayName: OWNER_NAME_ELIGIBLE_STATUSES.has(status) ? ownerDisplayName : null,
  };
}
