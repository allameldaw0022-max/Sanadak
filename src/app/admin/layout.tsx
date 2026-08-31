import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { getCurrentUser } from "@/lib/supabase/queries";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role === "developer") redirect("/developer/dashboard");
  if (user.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col md:flex-row">
      <AdminSidebar adminName={user.fullName || "مشرف سندك"} adminEmail={user.email || ""} />
      <div className="min-w-0 flex-1">
        <AdminTopbar />
        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</div>
      </div>
    </div>
  );
}
