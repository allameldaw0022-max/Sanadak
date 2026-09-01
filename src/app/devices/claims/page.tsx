import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileSearch, Plus, ChevronLeft } from "lucide-react";
import { getCurrentUser, getMyOwnershipClaims } from "@/lib/supabase/queries";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ClaimStatusBadge } from "@/components/devices/ClaimStatusBadge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "مطالباتي | سندك",
};

export default async function MyClaimsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const claims = await getMyOwnershipClaims(user.id);

  return (
    <Container className="py-8 sm:py-12">
      <SectionHeader title="مطالباتي" subtitle="مطالبات الملكية التي قدّمتها" />

      <div className="mb-5">
        <Link
          href="/devices/claims/new"
          className="flex h-11 w-fit items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          تقديم مطالبة جديدة
        </Link>
      </div>

      {claims.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <FileSearch className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">لا توجد مطالبات ملكية بعد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {claims.map((claim) => (
            <Link
              key={claim.id}
              href={`/devices/claims/${claim.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
                  <FileSearch className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-navy">
                    {claim.deviceBrand} {claim.deviceModel}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-400">قُدّمت في {formatDate(claim.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <ClaimStatusBadge status={claim.status} />
                <span className="flex items-center gap-0.5 text-xs font-semibold text-primary group-hover:text-primary-dark">
                  التفاصيل
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
