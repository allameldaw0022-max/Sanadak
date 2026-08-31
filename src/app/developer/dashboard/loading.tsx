import { Skeleton } from "@/components/ui/Skeleton";

export default function DeveloperDashboardLoading() {
  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <Skeleton className="h-11 w-full rounded-xl sm:w-40" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      <div className="mt-10">
        <Skeleton className="mb-4 h-5 w-24" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}
