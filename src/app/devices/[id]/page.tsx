import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowRight, Smartphone, Calendar, RefreshCw, Palette, Hash } from "lucide-react";
import { getCurrentUser, getMyDeviceById } from "@/lib/supabase/queries";
import { Container } from "@/components/ui/Container";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "تفاصيل الجهاز | سندك",
};

function InfoRow({ icon: Icon, label, value }: { icon: typeof Smartphone; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-navy" dir="ltr">
          {value}
        </p>
      </div>
    </div>
  );
}

// This page is the one place the owner's full, unmasked IMEI is ever
// rendered -- getMyDeviceById is scoped to owner_id (backed by RLS), so a
// request for a device that isn't this user's own returns null and the
// page 404s rather than leaking anything about who owns it.
export default async function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const device = await getMyDeviceById(user.id, id);
  if (!device) notFound();

  return (
    <Container className="py-8 sm:py-12">
      <Link
        href="/devices"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy"
      >
        <ArrowRight className="h-4 w-4" />
        أجهزتي
      </Link>

      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
              <Smartphone className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-lg font-extrabold text-navy">
                {device.brand} {device.model}
              </h1>
              <div className="mt-1">
                <DeviceStatusBadge status={device.currentStatus} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 px-3">
          <InfoRow icon={Hash} label="IMEI1" value={device.imei1} />
          {device.imei2 && <InfoRow icon={Hash} label="IMEI2" value={device.imei2} />}
          {device.color && <InfoRow icon={Palette} label="اللون" value={device.color} />}
          {device.serialNumber && <InfoRow icon={Hash} label="الرقم التسلسلي" value={device.serialNumber} />}
          <InfoRow icon={Calendar} label="تاريخ التسجيل" value={formatDate(device.createdAt)} />
          <InfoRow icon={RefreshCw} label="آخر تحديث" value={formatDate(device.updatedAt)} />
        </div>
      </div>
    </Container>
  );
}
