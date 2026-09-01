import { cn } from "@/lib/utils";

const deviceStatusLabels: Record<string, string> = {
  ACTIVE: "نشط",
  UNDER_REVIEW: "قيد المراجعة",
  LOST: "مفقود",
  STOLEN: "مسروق",
  RECOVERED: "مسترجع",
  BLOCKED: "محظور",
};

const deviceStatusStyles: Record<string, string> = {
  ACTIVE: "bg-primary-light text-primary-dark",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  LOST: "bg-orange-50 text-orange-700",
  STOLEN: "bg-red-50 text-red-600",
  RECOVERED: "bg-sky-50 text-sky-700",
  BLOCKED: "bg-slate-800 text-white",
};

// Shown only to the device's own owner (or admin) rendering their own data
// via RLS-scoped queries -- unlike the public IMEI check response, this
// badge never withholds BLOCKED, since it's the owner's own device.
export function DeviceStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        deviceStatusStyles[status] ?? "bg-slate-100 text-slate-600"
      )}
    >
      {deviceStatusLabels[status] ?? status}
    </span>
  );
}
