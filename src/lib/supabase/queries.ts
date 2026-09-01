import { cache } from "react";
import { createClient } from "./server";
import { maskImei } from "@/lib/devices/imei-format";
import type { Database, Json } from "./database.types";

export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: "user" | "developer" | "admin";
  isDealer: boolean;
};

// Every layout/page on a route independently needs to know who's signed
// in, which used to mean a fresh network round-trip to Supabase Auth per
// call site (Header, root layout, section layout, and the page itself
// could each fire their own `auth.getUser()` for a single navigation).
// `cache()` makes React reuse the same in-flight/resolved call for the
// life of one request, so however many places call this, only one actual
// auth check happens — the check itself is unchanged.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, is_dealer")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? null,
    fullName: profile?.full_name ?? null,
    role: profile?.role ?? "user",
    isDealer: profile?.is_dealer ?? false,
  };
});

export type AdminUserRow = {
  id: string;
  fullName: string;
  email: string;
  role: "user" | "developer" | "admin";
  isDealer: boolean;
  createdAt: string;
};

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_dealer, created_at")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name || "—",
    email: row.email || "",
    role: row.role,
    isDealer: row.is_dealer,
    createdAt: row.created_at,
  }));
}

// --- Device verification (Phase 3): read-only queries for the current
// user's own devices. Every device/device_imeis read here is additionally
// scoped by owner_id even though RLS already enforces this on its own
// (devices_select_own_or_admin / device_imeis_select_own_or_admin from the
// Phase 1 migration). imei_normalized never leaves this module unmasked
// except in getMyDeviceById, which is the one dedicated "owner views their
// own full IMEI" page these queries exist to serve.

export type DeviceListItem = {
  id: string;
  brand: string;
  model: string;
  color: string | null;
  serialNumber: string | null;
  currentStatus: Database["public"]["Enums"]["device_status"];
  createdAt: string;
  updatedAt: string;
  imei1Masked: string;
  imei2Masked: string | null;
};

export async function getMyDevices(ownerId: string): Promise<DeviceListItem[]> {
  const supabase = await createClient();
  const { data: devices } = await supabase
    .from("devices")
    .select("id, brand, model, color, serial_number, current_status, created_at, updated_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (!devices || devices.length === 0) return [];

  const { data: imeis } = await supabase
    .from("device_imeis")
    .select("device_id, imei_normalized, kind")
    .in(
      "device_id",
      devices.map((d) => d.id)
    );

  return devices.map((d) => {
    const deviceImeis = (imeis ?? []).filter((i) => i.device_id === d.id);
    const imei1 = deviceImeis.find((i) => i.kind === "imei1");
    const imei2 = deviceImeis.find((i) => i.kind === "imei2");
    return {
      id: d.id,
      brand: d.brand,
      model: d.model,
      color: d.color,
      serialNumber: d.serial_number,
      currentStatus: d.current_status,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      imei1Masked: imei1 ? maskImei(imei1.imei_normalized) : "",
      imei2Masked: imei2 ? maskImei(imei2.imei_normalized) : null,
    };
  });
}

export type DeviceDetail = DeviceListItem & {
  imei1: string;
  imei2: string | null;
};

export async function getMyDeviceById(ownerId: string, deviceId: string): Promise<DeviceDetail | null> {
  const supabase = await createClient();
  const { data: device } = await supabase
    .from("devices")
    .select("id, brand, model, color, serial_number, current_status, created_at, updated_at")
    .eq("id", deviceId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (!device) return null;

  const { data: imeis } = await supabase
    .from("device_imeis")
    .select("imei_normalized, kind")
    .eq("device_id", device.id);

  const imei1 = (imeis ?? []).find((i) => i.kind === "imei1");
  const imei2 = (imeis ?? []).find((i) => i.kind === "imei2");

  return {
    id: device.id,
    brand: device.brand,
    model: device.model,
    color: device.color,
    serialNumber: device.serial_number,
    currentStatus: device.current_status,
    createdAt: device.created_at,
    updatedAt: device.updated_at,
    imei1Masked: imei1 ? maskImei(imei1.imei_normalized) : "",
    imei2Masked: imei2 ? maskImei(imei2.imei_normalized) : null,
    imei1: imei1?.imei_normalized ?? "",
    imei2: imei2?.imei_normalized ?? null,
  };
}

// --- Ownership claims (Phase 3, section 7): read-only queries for the
// current user's own claims. deviceBrand/deviceModel/deviceColor come from
// the devices row a claimant can see only via the narrow devices_select_claimant
// RLS policy added in this phase -- owner_id is deliberately never selected
// here even though that policy would let it through at the row level.

export type MyClaimListItem = {
  id: string;
  status: Database["public"]["Enums"]["ownership_claim_status"];
  createdAt: string;
  updatedAt: string;
  deviceBrand: string;
  deviceModel: string;
};

export async function getMyOwnershipClaims(claimantId: string): Promise<MyClaimListItem[]> {
  const supabase = await createClient();
  const { data: claims } = await supabase
    .from("ownership_claims")
    .select("id, status, created_at, updated_at, device_id")
    .eq("claimant_id", claimantId)
    .order("created_at", { ascending: false });

  if (!claims || claims.length === 0) return [];

  const { data: devices } = await supabase
    .from("devices")
    .select("id, brand, model")
    .in(
      "id",
      claims.map((c) => c.device_id)
    );

  const deviceById = new Map((devices ?? []).map((d) => [d.id, d]));

  return claims.map((c) => {
    const device = deviceById.get(c.device_id);
    return {
      id: c.id,
      status: c.status,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      deviceBrand: device?.brand ?? "—",
      deviceModel: device?.model ?? "—",
    };
  });
}

export type MyClaimDetail = {
  id: string;
  status: Database["public"]["Enums"]["ownership_claim_status"];
  note: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  deviceBrand: string;
  deviceModel: string;
  deviceColor: string | null;
  evidence: { id: string; signedUrl: string | null; createdAt: string }[];
};

export async function getMyClaimById(claimantId: string, claimId: string): Promise<MyClaimDetail | null> {
  const supabase = await createClient();
  const { data: claim } = await supabase
    .from("ownership_claims")
    .select("id, status, note, rejection_reason, created_at, updated_at, device_id")
    .eq("id", claimId)
    .eq("claimant_id", claimantId)
    .maybeSingle();

  if (!claim) return null;

  const [{ data: device }, { data: evidence }] = await Promise.all([
    supabase.from("devices").select("brand, model, color").eq("id", claim.device_id).maybeSingle(),
    supabase
      .from("ownership_evidence")
      .select("id, storage_path, created_at")
      .eq("claim_id", claim.id)
      .order("created_at", { ascending: false }),
  ]);

  // Short-lived signed URLs (5 min), same pattern as payment-proofs -- the
  // bucket is private and never serves a public/permanent URL for evidence.
  const evidenceWithUrls = await Promise.all(
    (evidence ?? []).map(async (e) => {
      const { data: signed } = await supabase.storage
        .from("ownership-evidence")
        .createSignedUrl(e.storage_path, 300);
      return { id: e.id, signedUrl: signed?.signedUrl ?? null, createdAt: e.created_at };
    })
  );

  return {
    id: claim.id,
    status: claim.status,
    note: claim.note,
    rejectionReason: claim.rejection_reason,
    createdAt: claim.created_at,
    updatedAt: claim.updated_at,
    deviceBrand: device?.brand ?? "—",
    deviceModel: device?.model ?? "—",
    deviceColor: device?.color ?? null,
    evidence: evidenceWithUrls,
  };
}

// --- Device reports (Phase 3, section 8-9): a report is only ever
// submitted by the device's own current owner (see submitDeviceReportAction),
// so listing "reports for my device" is scoped by owner_id the same way
// getMyDeviceById already is -- RLS (device_reports_select_related) backs
// this up regardless.

export type DeviceReportListItem = {
  id: string;
  status: Database["public"]["Enums"]["device_report_status"];
  reportType: Database["public"]["Enums"]["device_report_type"];
  createdAt: string;
};

export async function getDeviceReportsForDevice(ownerId: string, deviceId: string): Promise<DeviceReportListItem[]> {
  const supabase = await createClient();
  const { data: device } = await supabase
    .from("devices")
    .select("id")
    .eq("id", deviceId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (!device) return [];

  const { data } = await supabase
    .from("device_reports")
    .select("id, status, report_type, created_at")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    status: r.status,
    reportType: r.report_type,
    createdAt: r.created_at,
  }));
}

export type MyReportListItem = {
  id: string;
  status: Database["public"]["Enums"]["device_report_status"];
  reportType: Database["public"]["Enums"]["device_report_type"];
  createdAt: string;
  deviceBrand: string;
  deviceModel: string;
};

export async function getMyDeviceReports(reporterId: string): Promise<MyReportListItem[]> {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("device_reports")
    .select("id, status, report_type, created_at, device_id")
    .eq("reporter_id", reporterId)
    .order("created_at", { ascending: false });

  if (!reports || reports.length === 0) return [];

  const { data: devices } = await supabase
    .from("devices")
    .select("id, brand, model")
    .in("id", reports.map((r) => r.device_id));

  const deviceById = new Map((devices ?? []).map((d) => [d.id, d]));

  return reports.map((r) => ({
    id: r.id,
    status: r.status,
    reportType: r.report_type,
    createdAt: r.created_at,
    deviceBrand: deviceById.get(r.device_id)?.brand ?? "—",
    deviceModel: deviceById.get(r.device_id)?.model ?? "—",
  }));
}

export type MyReportDetail = {
  id: string;
  status: Database["public"]["Enums"]["device_report_status"];
  reportType: Database["public"]["Enums"]["device_report_type"];
  details: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  deviceBrand: string;
  deviceModel: string;
  evidence: { id: string; signedUrl: string | null; createdAt: string }[];
};

export async function getMyReportById(reporterId: string, reportId: string): Promise<MyReportDetail | null> {
  const supabase = await createClient();
  const { data: report } = await supabase
    .from("device_reports")
    .select("id, status, report_type, details, admin_note, created_at, updated_at, device_id")
    .eq("id", reportId)
    .eq("reporter_id", reporterId)
    .maybeSingle();

  if (!report) return null;

  const [{ data: device }, { data: evidence }] = await Promise.all([
    supabase.from("devices").select("brand, model").eq("id", report.device_id).maybeSingle(),
    supabase
      .from("report_evidence")
      .select("id, storage_path, created_at")
      .eq("report_id", report.id)
      .order("created_at", { ascending: false }),
  ]);

  const evidenceWithUrls = await Promise.all(
    (evidence ?? []).map(async (e) => {
      const { data: signed } = await supabase.storage.from("report-evidence").createSignedUrl(e.storage_path, 300);
      return { id: e.id, signedUrl: signed?.signedUrl ?? null, createdAt: e.created_at };
    })
  );

  return {
    id: report.id,
    status: report.status,
    reportType: report.report_type,
    details: report.details,
    adminNote: report.admin_note,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
    deviceBrand: device?.brand ?? "—",
    deviceModel: device?.model ?? "—",
    evidence: evidenceWithUrls,
  };
}

// --- Admin (Phase 3, section 10): claims/reports review lists + detail.
// Reachable only through admin-gated pages; RLS (ownership_claims/
// device_reports/*_select_related, ownership_evidence/report_evidence
// *_select_related) already grants admin visibility on every row here
// regardless of relation to the admin's own account.

export type AdminClaimListItem = {
  id: string;
  status: Database["public"]["Enums"]["ownership_claim_status"];
  createdAt: string;
  deviceBrand: string;
  deviceModel: string;
  claimantEmail: string | null;
};

export async function getAdminOwnershipClaims(): Promise<AdminClaimListItem[]> {
  const supabase = await createClient();
  const { data: claims } = await supabase
    .from("ownership_claims")
    .select("id, status, created_at, device_id, claimant_id")
    .order("created_at", { ascending: false });

  if (!claims || claims.length === 0) return [];

  const [{ data: devices }, { data: claimants }] = await Promise.all([
    supabase
      .from("devices")
      .select("id, brand, model")
      .in("id", claims.map((c) => c.device_id)),
    supabase
      .from("profiles")
      .select("id, email")
      .in("id", claims.map((c) => c.claimant_id)),
  ]);

  const deviceById = new Map((devices ?? []).map((d) => [d.id, d]));
  const claimantById = new Map((claimants ?? []).map((p) => [p.id, p]));

  return claims.map((c) => ({
    id: c.id,
    status: c.status,
    createdAt: c.created_at,
    deviceBrand: deviceById.get(c.device_id)?.brand ?? "—",
    deviceModel: deviceById.get(c.device_id)?.model ?? "—",
    claimantEmail: claimantById.get(c.claimant_id)?.email ?? null,
  }));
}

export type AdminClaimDetail = MyClaimDetail & { claimantEmail: string | null };

export async function getAdminClaimById(claimId: string): Promise<AdminClaimDetail | null> {
  const supabase = await createClient();
  const { data: claim } = await supabase
    .from("ownership_claims")
    .select("id, status, note, rejection_reason, created_at, updated_at, device_id, claimant_id")
    .eq("id", claimId)
    .maybeSingle();

  if (!claim) return null;

  const [{ data: device }, { data: claimant }, { data: evidence }] = await Promise.all([
    supabase.from("devices").select("brand, model, color").eq("id", claim.device_id).maybeSingle(),
    supabase.from("profiles").select("email").eq("id", claim.claimant_id).maybeSingle(),
    supabase
      .from("ownership_evidence")
      .select("id, storage_path, created_at")
      .eq("claim_id", claim.id)
      .order("created_at", { ascending: false }),
  ]);

  const evidenceWithUrls = await Promise.all(
    (evidence ?? []).map(async (e) => {
      const { data: signed } = await supabase.storage
        .from("ownership-evidence")
        .createSignedUrl(e.storage_path, 300);
      return { id: e.id, signedUrl: signed?.signedUrl ?? null, createdAt: e.created_at };
    })
  );

  return {
    id: claim.id,
    status: claim.status,
    note: claim.note,
    rejectionReason: claim.rejection_reason,
    createdAt: claim.created_at,
    updatedAt: claim.updated_at,
    deviceBrand: device?.brand ?? "—",
    deviceModel: device?.model ?? "—",
    deviceColor: device?.color ?? null,
    claimantEmail: claimant?.email ?? null,
    evidence: evidenceWithUrls,
  };
}

export type AdminReportListItem = {
  id: string;
  status: Database["public"]["Enums"]["device_report_status"];
  reportType: Database["public"]["Enums"]["device_report_type"];
  createdAt: string;
  deviceBrand: string;
  deviceModel: string;
  reporterEmail: string | null;
};

export async function getAdminDeviceReports(): Promise<AdminReportListItem[]> {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("device_reports")
    .select("id, status, report_type, created_at, device_id, reporter_id")
    .order("created_at", { ascending: false });

  if (!reports || reports.length === 0) return [];

  const [{ data: devices }, { data: reporters }] = await Promise.all([
    supabase
      .from("devices")
      .select("id, brand, model")
      .in("id", reports.map((r) => r.device_id)),
    supabase
      .from("profiles")
      .select("id, email")
      .in("id", reports.map((r) => r.reporter_id)),
  ]);

  const deviceById = new Map((devices ?? []).map((d) => [d.id, d]));
  const reporterById = new Map((reporters ?? []).map((p) => [p.id, p]));

  return reports.map((r) => ({
    id: r.id,
    status: r.status,
    reportType: r.report_type,
    createdAt: r.created_at,
    deviceBrand: deviceById.get(r.device_id)?.brand ?? "—",
    deviceModel: deviceById.get(r.device_id)?.model ?? "—",
    reporterEmail: reporterById.get(r.reporter_id)?.email ?? null,
  }));
}

export type AdminReportDetail = MyReportDetail & { reporterEmail: string | null };

export async function getAdminReportById(reportId: string): Promise<AdminReportDetail | null> {
  const supabase = await createClient();
  const { data: report } = await supabase
    .from("device_reports")
    .select("id, status, report_type, details, admin_note, created_at, updated_at, device_id, reporter_id")
    .eq("id", reportId)
    .maybeSingle();

  if (!report) return null;

  const [{ data: device }, { data: reporter }, { data: evidence }] = await Promise.all([
    supabase.from("devices").select("brand, model").eq("id", report.device_id).maybeSingle(),
    supabase.from("profiles").select("email").eq("id", report.reporter_id).maybeSingle(),
    supabase
      .from("report_evidence")
      .select("id, storage_path, created_at")
      .eq("report_id", report.id)
      .order("created_at", { ascending: false }),
  ]);

  const evidenceWithUrls = await Promise.all(
    (evidence ?? []).map(async (e) => {
      const { data: signed } = await supabase.storage.from("report-evidence").createSignedUrl(e.storage_path, 300);
      return { id: e.id, signedUrl: signed?.signedUrl ?? null, createdAt: e.created_at };
    })
  );

  return {
    id: report.id,
    status: report.status,
    reportType: report.report_type,
    details: report.details,
    adminNote: report.admin_note,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
    deviceBrand: device?.brand ?? "—",
    deviceModel: device?.model ?? "—",
    reporterEmail: reporter?.email ?? null,
    evidence: evidenceWithUrls,
  };
}

// --- Notifications (Phase 3, section 11): read-only queries for the
// current user's own notifications. RLS (notifications_select_own) scopes
// every row to user_id = auth.uid() regardless of this explicit filter.

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  relatedTable: string | null;
  relatedId: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function getMyNotifications(userId: string): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, related_table, related_id, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    relatedTable: n.related_table,
    relatedId: n.related_id,
    readAt: n.read_at,
    createdAt: n.created_at,
  }));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

// --- Certificates (Phase 4, section 12): a certificate's "valid" flag is
// computed the exact same way here as in verify_certificate (device row
// still owned by whoever it was issued to, and in an ACTIVE/RECOVERED
// state) -- if the underlying device is no longer visible to this owner at
// all (e.g. ownership since transferred away), it's treated as invalid,
// which is the correct outcome either way.

export type MyCertificateListItem = {
  id: string;
  issuedAt: string;
  deviceBrand: string;
  deviceModel: string;
  valid: boolean;
};

export async function getMyCertificates(ownerId: string): Promise<MyCertificateListItem[]> {
  const supabase = await createClient();
  const { data: certificates } = await supabase
    .from("device_certificates")
    .select("id, issued_at, device_id, issued_to")
    .eq("issued_to", ownerId)
    .order("issued_at", { ascending: false });

  if (!certificates || certificates.length === 0) return [];

  const { data: devices } = await supabase
    .from("devices")
    .select("id, brand, model, owner_id, current_status")
    .in("id", certificates.map((c) => c.device_id));

  const deviceById = new Map((devices ?? []).map((d) => [d.id, d]));

  return certificates.map((c) => {
    const device = deviceById.get(c.device_id);
    const valid = !!device && device.owner_id === c.issued_to && ["ACTIVE", "RECOVERED"].includes(device.current_status);
    return {
      id: c.id,
      issuedAt: c.issued_at,
      deviceBrand: device?.brand ?? "—",
      deviceModel: device?.model ?? "—",
      valid,
    };
  });
}

export type MyCertificateDetail = MyCertificateListItem;

export async function getMyCertificateById(ownerId: string, certificateId: string): Promise<MyCertificateDetail | null> {
  const supabase = await createClient();
  const { data: certificate } = await supabase
    .from("device_certificates")
    .select("id, issued_at, device_id, issued_to")
    .eq("id", certificateId)
    .eq("issued_to", ownerId)
    .maybeSingle();

  if (!certificate) return null;

  const { data: device } = await supabase
    .from("devices")
    .select("brand, model, owner_id, current_status")
    .eq("id", certificate.device_id)
    .maybeSingle();

  const valid = !!device && device.owner_id === certificate.issued_to && ["ACTIVE", "RECOVERED"].includes(device.current_status);

  return {
    id: certificate.id,
    issuedAt: certificate.issued_at,
    deviceBrand: device?.brand ?? "—",
    deviceModel: device?.model ?? "—",
    valid,
  };
}

// --- Admin dashboard (Sanadak): device-wide stats, device management,
// certificates, and security-event audit. Every read here is reachable
// only via /admin (role-gated by the admin layout) and is backed by RLS's
// own admin bypass on each table (devices_select_own_or_admin,
// device_status_history_select_own_or_admin, device_certificates_select_own_or_admin,
// security_events_select_own_or_admin) -- none of this widens what an
// admin session can already read at the database level. Raw IMEI is never
// selected here, only maskImei() output, matching the one-page-only
// full-IMEI precedent from getMyDeviceById.

export type AdminDeviceStats = {
  totalDevices: number;
  active: number;
  underReview: number;
  lost: number;
  stolen: number;
  recovered: number;
  blocked: number;
  pendingClaims: number;
  pendingReports: number;
  totalNotifications: number;
  totalDealers: number;
};

export async function getAdminDeviceStats(): Promise<AdminDeviceStats> {
  const supabase = await createClient();
  const [devices, claims, reports, notifications, dealers] = await Promise.all([
    supabase.from("devices").select("current_status"),
    supabase.from("ownership_claims").select("id", { count: "exact", head: true }).not("status", "in", "(APPROVED,REJECTED)"),
    supabase.from("device_reports").select("id", { count: "exact", head: true }).not("status", "in", "(APPROVED,REJECTED)"),
    supabase.from("notifications").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_dealer", true),
  ]);

  const byStatus = (devices.data ?? []).reduce<Record<string, number>>((acc, d) => {
    acc[d.current_status] = (acc[d.current_status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalDevices: devices.data?.length ?? 0,
    active: byStatus.ACTIVE ?? 0,
    underReview: byStatus.UNDER_REVIEW ?? 0,
    lost: byStatus.LOST ?? 0,
    stolen: byStatus.STOLEN ?? 0,
    recovered: byStatus.RECOVERED ?? 0,
    blocked: byStatus.BLOCKED ?? 0,
    pendingClaims: claims.count ?? 0,
    pendingReports: reports.count ?? 0,
    totalNotifications: notifications.count ?? 0,
    totalDealers: dealers.count ?? 0,
  };
}

export type AdminDeviceListItem = {
  id: string;
  brand: string;
  model: string;
  currentStatus: Database["public"]["Enums"]["device_status"];
  ownerEmail: string | null;
  createdAt: string;
};

export async function getAdminDevices(filter?: {
  status?: Database["public"]["Enums"]["device_status"];
}): Promise<AdminDeviceListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("devices")
    .select("id, brand, model, current_status, owner_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter?.status) query = query.eq("current_status", filter.status);

  const { data: devices } = await query;
  if (!devices || devices.length === 0) return [];

  const { data: owners } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", devices.map((d) => d.owner_id));
  const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));

  return devices.map((d) => ({
    id: d.id,
    brand: d.brand,
    model: d.model,
    currentStatus: d.current_status,
    ownerEmail: ownerById.get(d.owner_id)?.email ?? null,
    createdAt: d.created_at,
  }));
}

export type AdminDeviceDetail = {
  id: string;
  brand: string;
  model: string;
  color: string | null;
  serialNumber: string | null;
  currentStatus: Database["public"]["Enums"]["device_status"];
  ownerEmail: string | null;
  imei1Masked: string;
  imei2Masked: string | null;
  createdAt: string;
  updatedAt: string;
  history: {
    id: string;
    oldStatus: Database["public"]["Enums"]["device_status"] | null;
    newStatus: Database["public"]["Enums"]["device_status"];
    reason: string | null;
    source: string;
    createdAt: string;
  }[];
};

export async function getAdminDeviceById(deviceId: string): Promise<AdminDeviceDetail | null> {
  const supabase = await createClient();
  const { data: device } = await supabase
    .from("devices")
    .select("id, brand, model, color, serial_number, current_status, owner_id, created_at, updated_at")
    .eq("id", deviceId)
    .maybeSingle();

  if (!device) return null;

  const [{ data: owner }, { data: imeis }, { data: history }] = await Promise.all([
    supabase.from("profiles").select("email").eq("id", device.owner_id).maybeSingle(),
    supabase.from("device_imeis").select("imei_normalized, kind").eq("device_id", device.id),
    supabase
      .from("device_status_history")
      .select("id, old_status, new_status, reason, source, created_at")
      .eq("device_id", device.id)
      .order("created_at", { ascending: false }),
  ]);

  const imei1 = (imeis ?? []).find((i) => i.kind === "imei1");
  const imei2 = (imeis ?? []).find((i) => i.kind === "imei2");

  return {
    id: device.id,
    brand: device.brand,
    model: device.model,
    color: device.color,
    serialNumber: device.serial_number,
    currentStatus: device.current_status,
    ownerEmail: owner?.email ?? null,
    imei1Masked: imei1 ? maskImei(imei1.imei_normalized) : "",
    imei2Masked: imei2 ? maskImei(imei2.imei_normalized) : null,
    createdAt: device.created_at,
    updatedAt: device.updated_at,
    history: (history ?? []).map((h) => ({
      id: h.id,
      oldStatus: h.old_status,
      newStatus: h.new_status,
      reason: h.reason,
      source: h.source,
      createdAt: h.created_at,
    })),
  };
}

export type AdminCertificateListItem = {
  id: string;
  deviceBrand: string;
  deviceModel: string;
  issuedToEmail: string | null;
  issuedAt: string;
  valid: boolean;
};

export async function getAdminCertificates(): Promise<AdminCertificateListItem[]> {
  const supabase = await createClient();
  const { data: certificates } = await supabase
    .from("device_certificates")
    .select("id, device_id, issued_to, issued_at")
    .order("issued_at", { ascending: false })
    .limit(200);

  if (!certificates || certificates.length === 0) return [];

  const [{ data: devices }, { data: owners }] = await Promise.all([
    supabase
      .from("devices")
      .select("id, brand, model, owner_id, current_status")
      .in("id", certificates.map((c) => c.device_id)),
    supabase
      .from("profiles")
      .select("id, email")
      .in("id", certificates.map((c) => c.issued_to)),
  ]);

  const deviceById = new Map((devices ?? []).map((d) => [d.id, d]));
  const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));

  return certificates.map((c) => {
    const device = deviceById.get(c.device_id);
    const valid = !!device && device.owner_id === c.issued_to && ["ACTIVE", "RECOVERED"].includes(device.current_status);
    return {
      id: c.id,
      deviceBrand: device?.brand ?? "—",
      deviceModel: device?.model ?? "—",
      issuedToEmail: ownerById.get(c.issued_to)?.email ?? null,
      issuedAt: c.issued_at,
      valid,
    };
  });
}

export type AdminNotificationItem = {
  id: string;
  userEmail: string | null;
  type: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function getAdminNotifications(): Promise<AdminNotificationItem[]> {
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, user_id, type, title, body, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!notifications || notifications.length === 0) return [];

  const { data: users } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", notifications.map((n) => n.user_id));
  const userById = new Map((users ?? []).map((u) => [u.id, u]));

  return notifications.map((n) => ({
    id: n.id,
    userEmail: userById.get(n.user_id)?.email ?? null,
    type: n.type,
    title: n.title,
    body: n.body,
    readAt: n.read_at,
    createdAt: n.created_at,
  }));
}

// --- Dealer subscriptions: plan catalog, payment methods, request/status
// queries. Plans/payment methods are read via RLS's own dealer-or-admin /
// active-only gating (subscription_plans_select_active_or_admin,
// payment_methods_select_dealer_or_admin) -- nothing here widens what those
// policies already allow. Payment proof/logo paths are only ever turned
// into short-lived signed URLs (private buckets), same pattern already
// used for ownership/report evidence.

export type SubscriptionPlanItem = {
  id: string;
  name: string;
  monthlyPriceSdg: number;
  maxDevices: number;
  description: string | null;
};

export async function getActiveSubscriptionPlans(): Promise<SubscriptionPlanItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscription_plans")
    .select("id, name, monthly_price_sdg, max_devices, description")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    monthlyPriceSdg: p.monthly_price_sdg,
    maxDevices: p.max_devices,
    description: p.description,
  }));
}

export type PaymentMethodItem = {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  iban: string | null;
  phoneOrWallet: string | null;
  instructions: string | null;
};

export async function getActivePaymentMethods(): Promise<PaymentMethodItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_methods")
    .select("id, bank_name, account_holder_name, account_number, iban, phone_or_wallet, instructions")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  return (data ?? []).map((m) => ({
    id: m.id,
    bankName: m.bank_name,
    accountHolderName: m.account_holder_name,
    accountNumber: m.account_number,
    iban: m.iban,
    phoneOrWallet: m.phone_or_wallet,
    instructions: m.instructions,
  }));
}

export type DealerSubscriptionStatus = {
  planName: string;
  maxDevices: number;
  usedDevices: number;
  status: Database["public"]["Enums"]["dealer_subscription_status"];
  isCurrentlyActive: boolean;
  expiresAt: string;
} | null;

export async function getMyDealerSubscriptionStatus(dealerId: string): Promise<DealerSubscriptionStatus> {
  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("dealer_subscriptions")
    .select("plan_id, max_devices_snapshot, status, expires_at")
    .eq("dealer_id", dealerId)
    .maybeSingle();

  if (!sub) return null;

  const [{ data: plan }, { count }] = await Promise.all([
    supabase.from("subscription_plans").select("name").eq("id", sub.plan_id).maybeSingle(),
    supabase.from("devices").select("id", { count: "exact", head: true }).eq("owner_id", dealerId),
  ]);

  return {
    planName: plan?.name ?? "—",
    maxDevices: sub.max_devices_snapshot,
    usedDevices: count ?? 0,
    status: sub.status,
    isCurrentlyActive: sub.status === "active" && new Date(sub.expires_at) > new Date(),
    expiresAt: sub.expires_at,
  };
}

export type MySubscriptionRequestItem = {
  id: string;
  planName: string;
  amountSdg: number;
  status: Database["public"]["Enums"]["dealer_subscription_request_status"];
  rejectionReason: string | null;
  createdAt: string;
};

export async function getMySubscriptionRequests(dealerId: string): Promise<MySubscriptionRequestItem[]> {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("dealer_subscription_requests")
    .select("id, plan_id, amount_sdg, status, rejection_reason, created_at")
    .eq("dealer_id", dealerId)
    .order("created_at", { ascending: false });

  if (!requests || requests.length === 0) return [];

  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("id, name")
    .in("id", requests.map((r) => r.plan_id));
  const planById = new Map((plans ?? []).map((p) => [p.id, p]));

  return requests.map((r) => ({
    id: r.id,
    planName: planById.get(r.plan_id)?.name ?? "—",
    amountSdg: r.amount_sdg,
    status: r.status,
    rejectionReason: r.rejection_reason,
    createdAt: r.created_at,
  }));
}

// A dealer with a pending request can't submit another until it's decided
// -- the Server Action checks this before inserting.
export async function hasPendingSubscriptionRequest(dealerId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("dealer_subscription_requests")
    .select("id", { count: "exact", head: true })
    .eq("dealer_id", dealerId)
    .eq("status", "pending");
  return (count ?? 0) > 0;
}

export type DealerProfileDetail = {
  businessName: string | null;
  contactName: string | null;
  phone: string | null;
  address: string | null;
  logoSignedUrl: string | null;
};

export async function getMyDealerProfile(dealerId: string): Promise<DealerProfileDetail | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, contact_name, phone, address, logo_path")
    .eq("id", dealerId)
    .maybeSingle();

  if (!profile) return null;

  let logoSignedUrl: string | null = null;
  if (profile.logo_path) {
    const { data: signed } = await supabase.storage.from("dealer-logos").createSignedUrl(profile.logo_path, 300);
    logoSignedUrl = signed?.signedUrl ?? null;
  }

  return {
    businessName: profile.business_name,
    contactName: profile.contact_name,
    phone: profile.phone,
    address: profile.address,
    logoSignedUrl,
  };
}

// --- Admin: subscription plans / payment methods (full CRUD lists, incl.
// inactive) + subscription request review queue + dealer usage overview.

export type AdminSubscriptionPlanItem = SubscriptionPlanItem & { isActive: boolean; sortOrder: number };

export async function getAdminSubscriptionPlans(): Promise<AdminSubscriptionPlanItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscription_plans")
    .select("id, name, monthly_price_sdg, max_devices, description, is_active, sort_order")
    .order("sort_order", { ascending: true });

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    monthlyPriceSdg: p.monthly_price_sdg,
    maxDevices: p.max_devices,
    description: p.description,
    isActive: p.is_active,
    sortOrder: p.sort_order,
  }));
}

export type AdminPaymentMethodItem = PaymentMethodItem & { isActive: boolean };

export async function getAdminPaymentMethods(): Promise<AdminPaymentMethodItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_methods")
    .select("id, bank_name, account_holder_name, account_number, iban, phone_or_wallet, instructions, is_active")
    .order("created_at", { ascending: true });

  return (data ?? []).map((m) => ({
    id: m.id,
    bankName: m.bank_name,
    accountHolderName: m.account_holder_name,
    accountNumber: m.account_number,
    iban: m.iban,
    phoneOrWallet: m.phone_or_wallet,
    instructions: m.instructions,
    isActive: m.is_active,
  }));
}

export type AdminSubscriptionRequestItem = {
  id: string;
  dealerEmail: string | null;
  dealerBusinessName: string | null;
  planName: string;
  amountSdg: number;
  status: Database["public"]["Enums"]["dealer_subscription_request_status"];
  rejectionReason: string | null;
  paymentProofSignedUrl: string | null;
  createdAt: string;
};

export async function getAdminSubscriptionRequests(filter?: {
  status?: Database["public"]["Enums"]["dealer_subscription_request_status"];
}): Promise<AdminSubscriptionRequestItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("dealer_subscription_requests")
    .select("id, dealer_id, plan_id, amount_sdg, status, rejection_reason, payment_proof_path, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter?.status) query = query.eq("status", filter.status);

  const { data: requests } = await query;
  if (!requests || requests.length === 0) return [];

  const [{ data: dealers }, { data: plans }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, business_name")
      .in("id", requests.map((r) => r.dealer_id)),
    supabase
      .from("subscription_plans")
      .select("id, name")
      .in("id", requests.map((r) => r.plan_id)),
  ]);

  const dealerById = new Map((dealers ?? []).map((d) => [d.id, d]));
  const planById = new Map((plans ?? []).map((p) => [p.id, p]));

  return Promise.all(
    requests.map(async (r) => {
      const { data: signed } = await supabase.storage
        .from("subscription-payment-proofs")
        .createSignedUrl(r.payment_proof_path, 300);
      return {
        id: r.id,
        dealerEmail: dealerById.get(r.dealer_id)?.email ?? null,
        dealerBusinessName: dealerById.get(r.dealer_id)?.business_name ?? null,
        planName: planById.get(r.plan_id)?.name ?? "—",
        amountSdg: r.amount_sdg,
        status: r.status,
        rejectionReason: r.rejection_reason,
        paymentProofSignedUrl: signed?.signedUrl ?? null,
        createdAt: r.created_at,
      };
    })
  );
}

export type AdminDealerUsageItem = {
  dealerId: string;
  dealerEmail: string | null;
  dealerBusinessName: string | null;
  planName: string;
  maxDevices: number;
  usedDevices: number;
  status: Database["public"]["Enums"]["dealer_subscription_status"];
  isCurrentlyActive: boolean;
  expiresAt: string;
};

export async function getAdminDealerUsage(): Promise<AdminDealerUsageItem[]> {
  const supabase = await createClient();
  const { data: subs } = await supabase
    .from("dealer_subscriptions")
    .select("dealer_id, plan_id, max_devices_snapshot, status, expires_at")
    .order("expires_at", { ascending: false });

  if (!subs || subs.length === 0) return [];

  const [{ data: dealers }, { data: plans }, { data: devices }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, business_name")
      .in("id", subs.map((s) => s.dealer_id)),
    supabase
      .from("subscription_plans")
      .select("id, name")
      .in("id", subs.map((s) => s.plan_id)),
    supabase
      .from("devices")
      .select("owner_id")
      .in("owner_id", subs.map((s) => s.dealer_id)),
  ]);

  const dealerById = new Map((dealers ?? []).map((d) => [d.id, d]));
  const planById = new Map((plans ?? []).map((p) => [p.id, p]));
  const usedByDealer = (devices ?? []).reduce<Record<string, number>>((acc, d) => {
    acc[d.owner_id] = (acc[d.owner_id] ?? 0) + 1;
    return acc;
  }, {});

  return subs.map((s) => ({
    dealerId: s.dealer_id,
    dealerEmail: dealerById.get(s.dealer_id)?.email ?? null,
    dealerBusinessName: dealerById.get(s.dealer_id)?.business_name ?? null,
    planName: planById.get(s.plan_id)?.name ?? "—",
    maxDevices: s.max_devices_snapshot,
    usedDevices: usedByDealer[s.dealer_id] ?? 0,
    status: s.status,
    isCurrentlyActive: s.status === "active" && new Date(s.expires_at) > new Date(),
    expiresAt: s.expires_at,
  }));
}

export type AdminSecurityEventItem = {
  id: string;
  eventType: string;
  actorEmail: string | null;
  actorRole: string | null;
  metadata: Json;
  createdAt: string;
};

// Never includes appId/scanId join data (store-specific) -- this is a raw
// chronological feed of security_events for admin audit, metadata is
// exactly what logSecurityEvent() call sites already wrote (imei_hash
// only, never a raw IMEI -- confirmed at every device Server Action call
// site; nothing here changes what those call sites are allowed to log).
export async function getAdminSecurityEvents(limit = 100): Promise<AdminSecurityEventItem[]> {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("security_events")
    .select("id, event_type, actor_id, actor_role, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!events || events.length === 0) return [];

  const actorIds = events.map((e) => e.actor_id).filter((id): id is string => !!id);
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, email").in("id", actorIds)
    : { data: [] as { id: string; email: string | null }[] };
  const actorById = new Map((actors ?? []).map((a) => [a.id, a]));

  return events.map((e) => ({
    id: e.id,
    eventType: e.event_type,
    actorEmail: e.actor_id ? (actorById.get(e.actor_id)?.email ?? null) : null,
    actorRole: e.actor_role,
    metadata: e.metadata,
    createdAt: e.created_at,
  }));
}
