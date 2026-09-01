import type { Metadata } from "next";
import Link from "next/link";
import { getAdminDevices } from "@/lib/supabase/queries";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { formatDate, cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";

export const metadata: Metadata = {
  title: "الأجهزة | سندك",
};

type DeviceStatus = Database["public"]["Enums"]["device_status"];
const statuses: DeviceStatus[] = ["ACTIVE", "UNDER_REVIEW", "LOST", "STOLEN", "RECOVERED", "BLOCKED"];
const statusLabels: Record<string, string> = {
  all: "الكل",
  ACTIVE: "نشط",
  UNDER_REVIEW: "قيد المراجعة",
  LOST: "مفقود",
  STOLEN: "مسروق",
  RECOVERED: "مسترجع",
  BLOCKED: "محظور",
};

export default async function AdminDevicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const validStatus = statuses.includes(status as DeviceStatus) ? (status as DeviceStatus) : undefined;
  const devices = await getAdminDevices(validStatus ? { status: validStatus } : undefined);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">الأجهزة</h1>
        <p className="mt-1 text-sm text-slate-500">جميع الأجهزة المسجلة على سندك ({devices.length})</p>
      </div>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {["all", ...statuses].map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/devices" : `/admin/devices?status=${s}`}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
              (s === "all" && !validStatus) || s === validStatus
                ? "bg-primary text-white"
                : "border border-slate-200 bg-white text-slate-600"
            )}
          >
            {statusLabels[s]}
          </Link>
        ))}
      </div>

      {devices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">لا توجد أجهزة هنا.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <th className="px-5 py-3 font-semibold">الجهاز</th>
                  <th className="px-5 py-3 font-semibold">المالك</th>
                  <th className="px-5 py-3 font-semibold">الحالة</th>
                  <th className="px-5 py-3 font-semibold">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/devices/${d.id}`} className="font-semibold text-navy hover:text-primary">
                        {d.brand} {d.model}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{d.ownerEmail ?? "—"}</td>
                    <td className="px-5 py-3">
                      <DeviceStatusBadge status={d.currentStatus} />
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(d.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
