import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Smartphone, Plus, ChevronLeft } from "lucide-react";
import { getCurrentUser, getMyDevices } from "@/lib/supabase/queries";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "أجهزتي | سندك",
};

export default async function MyDevicesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const devices = await getMyDevices(user.id);

  return (
    <Container className="py-8 sm:py-12">
      <SectionHeader title="أجهزتي" subtitle="الأجهزة المسجلة باسمك على سندك" />

      <div className="mb-5">
        <Link
          href="/devices/new"
          className="flex h-11 w-fit items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          تسجيل جهاز جديد
        </Link>
      </div>

      {devices.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Smartphone className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">لا توجد أجهزة مسجلة بعد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <Link
              key={device.id}
              href={`/devices/${device.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-navy">
                    {device.brand} {device.model}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-slate-500" dir="ltr">
                    {device.imei1Masked}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <DeviceStatusBadge status={device.currentStatus} />
                <span className="flex items-center gap-0.5 text-xs font-semibold text-primary group-hover:text-primary-dark">
                  التفاصيل
                  <ChevronLeft className="h-3.5 w-3.5" />
                </span>
              </div>

              <p className="text-[11px] text-slate-400">سُجّل في {formatDate(device.createdAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
