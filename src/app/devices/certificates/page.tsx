import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, BadgeCheck } from "lucide-react";
import { getCurrentUser, getMyCertificates } from "@/lib/supabase/queries";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "شهاداتي | سندك",
  robots: { index: false },
};

export default async function MyCertificatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const certificates = await getMyCertificates(user.id);

  return (
    <Container className="py-8 sm:py-12">
      <SectionHeader title="شهاداتي" subtitle="شهادات ملكية الأجهزة القابلة للتحقق عبر QR" />

      {certificates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <BadgeCheck className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">لا توجد شهادات بعد. يمكنك إصدار شهادة من صفحة تفاصيل الجهاز.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((c) => (
            <Link
              key={c.id}
              href={`/devices/certificates/${c.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
                  <BadgeCheck className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-navy">
                    {c.deviceBrand} {c.deviceModel}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-400">صدرت في {formatDate(c.issuedAt)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    c.valid ? "bg-primary-light text-primary-dark" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {c.valid ? "سارية" : "غير سارية"}
                </span>
                <span className="flex items-center gap-0.5 text-xs font-semibold text-primary group-hover:text-primary-dark">
                  عرض
                  <ChevronLeft className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
