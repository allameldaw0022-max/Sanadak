import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DeveloperSidebar } from "@/components/developer/DeveloperSidebar";
import { DeveloperTopbar } from "@/components/developer/DeveloperTopbar";
import { getCurrentUser } from "@/lib/supabase/queries";

export default async function DeveloperDashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin/apps");
  if (user.role !== "developer") redirect("/developer/register");

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col md:flex-row">
      <DeveloperSidebar
        developerName={user.fullName || "مطور سندك"}
        developerEmail={user.email || ""}
      />
      <div className="min-w-0 flex-1">
        <DeveloperTopbar />
        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</div>
      </div>
    </div>
  );
}
