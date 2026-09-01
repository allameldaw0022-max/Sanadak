import type { Metadata } from "next";
import Link from "next/link";
import { getAdminOwnershipClaims } from "@/lib/supabase/queries";
import { ClaimStatusBadge } from "@/components/devices/ClaimStatusBadge";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "مطالبات الملكية | سندك",
};

export default async function AdminOwnershipClaimsPage() {
  const claims = await getAdminOwnershipClaims();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">مطالبات الملكية</h1>
        <p className="mt-1 text-sm text-slate-500">مراجعة مطالبات ملكية الأجهزة ({claims.length})</p>
      </div>

      {claims.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">لا توجد مطالبات حاليًا.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((c) => (
            <Link
              key={c.id}
              href={`/admin/devices/claims/${c.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/30"
            >
              <div>
                <p className="text-sm font-bold text-navy">
                  {c.deviceBrand} {c.deviceModel}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {c.claimantEmail ?? "—"} · {formatDateTime(c.createdAt)}
                </p>
              </div>
              <ClaimStatusBadge status={c.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
