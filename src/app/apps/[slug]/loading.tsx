import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AppDetailsLoading() {
  return (
    <Container className="py-8 sm:py-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col items-center gap-5 sm:flex-row sm:items-start">
          <Skeleton className="h-20 w-20 shrink-0 rounded-2xl sm:h-24 sm:w-24" />
          <div className="w-full flex-1 space-y-3">
            <Skeleton className="mx-auto h-7 w-48 sm:mx-0" />
            <Skeleton className="mx-auto h-4 w-32 sm:mx-0" />
            <Skeleton className="mx-auto h-6 w-40 sm:mx-0" />
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-72">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="mt-4 h-20 w-full rounded-2xl" />
        </div>
      </div>

      <div className="mt-10">
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-32 shrink-0 rounded-2xl sm:h-64 sm:w-40" />
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-3 h-40 w-full rounded-2xl" />
        </div>
      </div>
    </Container>
  );
}
