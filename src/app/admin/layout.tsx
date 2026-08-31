import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getCurrentUser } from "@/lib/supabase/queries";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role === "developer") redirect("/developer/dashboard");
  if (user.role !== "admin") redirect("/");

  return (
    <div>
      <div className="border-b border-slate-200 bg-navy">
        <Container className="flex h-14 items-center gap-2 text-white">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-sm font-bold">لوحة مراجعة سندك</span>
          <Link
            href="/admin/apps"
            className="mr-auto text-sm font-semibold text-slate-300 hover:text-white"
          >
            مراجعة التطبيقات
          </Link>
        </Container>
      </div>
      {children}
    </div>
  );
}
