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

const NOT_DISCLOSED_MESSAGE = "تعذر إظهار نتيجة التحقق.";

export type ImeiCheckDisclosure =
  | { disclosed: true; status: Exclude<DeviceStatus, "BLOCKED">; message: string }
  | { disclosed: false; message: string };

// Maps a raw DB lookup result to the public-facing response shape. This is
// the single place that decides what a stranger is allowed to learn from an
// IMEI check, so it is deliberately narrow: it only ever receives a status
// enum (or null for "no row found") -- it can't leak owner data because it
// never had access to any in the first place (public_check_device_status
// only ever selects `current_status`, nothing else).
//
// "not found" and "BLOCKED" resolve to the exact same {disclosed:false,
// message} shape on purpose: an attacker must not be able to tell an
// unregistered IMEI apart from one that exists but is deliberately hidden.
export function buildImeiCheckDisclosure(status: DeviceStatus | null): ImeiCheckDisclosure {
  if (status === null || status === "BLOCKED") {
    return { disclosed: false, message: NOT_DISCLOSED_MESSAGE };
  }
  return { disclosed: true, status, message: DISCLOSED_STATUS_MESSAGES[status] };
}
