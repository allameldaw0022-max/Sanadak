import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Smartphone, Hash, Palette, Calendar, History } from "lucide-react";
import { getAdminDeviceById } from "@/lib/supabase/queries";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { DeviceStatusChangeForm } from "@/components/admin/DeviceStatusChangeForm";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "تفاصيل الجهاز | سندك",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "نشط",
  UNDER_REVIEW: "قيد المراجعة",
  LOST: "مفقود",
  STOLEN: "مسروق",
  RECOVERED: "مسترجع",
  BLOCKED: "محظور",
};

export default async function AdminDeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const device = await getAdminDeviceById(id);
  if (!device) notFound();

  return (
    <div>
      <Link
        href="/admin/devices"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy"
      >
        <ArrowRight className="h-4 w-4" />
        الأجهزة
      </Link>

      <div className="max-w-2xl space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
                <Smartphone className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-lg font-extrabold text-navy">
                  {device.brand} {device.model}
                </h1>
                <p className="text-xs text-slate-500">المالك: {device.ownerEmail ?? "—"}</p>
              </div>
            </div>
            <DeviceStatusBadge status={device.currentStatus} />
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 px-3">
            <div className="flex items-center gap-3 border-b border-slate-100 py-3">
              <Hash className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-400">IMEI1</span>
              <span className="mr-auto text-sm font-semibold text-navy" dir="ltr">
                {device.imei1Masked}
              </span>
            </div>
            {device.imei2Masked && (
              <div className="flex items-center gap-3 border-b border-slate-100 py-3">
                <Hash className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-400">IMEI2</span>
                <span className="mr-auto text-sm font-semibold text-navy" dir="ltr">
                  {device.imei2Masked}
                </span>
              </div>
            )}
            {device.color && (
              <div className="flex items-center gap-3 border-b border-slate-100 py-3">
                <Palette className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-400">اللون</span>
                <span className="mr-auto text-sm font-semibold text-navy">{device.color}</span>
              </div>
            )}
            <div className="flex items-center gap-3 py-3">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-400">تاريخ التسجيل</span>
              <span className="mr-auto text-sm font-semibold text-navy">{formatDateTime(device.createdAt)}</span>
            </div>
          </div>

          <div className="mt-4">
            <DeviceStatusChangeForm deviceId={device.id} currentStatus={device.currentStatus} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-bold text-navy">سجل الحالة</h2>
          </div>

          {device.history.length === 0 ? (
            <p className="text-xs text-slate-400">لا يوجد سجل تغييرات بعد.</p>
          ) : (
            <div className="space-y-2">
              {device.history.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <span className="text-xs font-semibold text-navy">
                    {h.oldStatus ? `${statusLabels[h.oldStatus] ?? h.oldStatus} ← ` : ""}
                    {statusLabels[h.newStatus] ?? h.newStatus}
                    {h.reason ? ` · ${h.reason}` : ""}
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-400">{formatDateTime(h.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
