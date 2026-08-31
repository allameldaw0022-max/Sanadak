import type { ReactNode } from "react";
import { DeveloperSidebar } from "@/components/developer/DeveloperSidebar";
import { DeveloperTopbar } from "@/components/developer/DeveloperTopbar";

export default function DeveloperDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col md:flex-row">
      <DeveloperSidebar />
      <div className="min-w-0 flex-1">
        <DeveloperTopbar />
        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</div>
      </div>
    </div>
  );
}
