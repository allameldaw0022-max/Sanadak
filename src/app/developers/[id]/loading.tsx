import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DeveloperProfileLoading() {
  return (
    <Container className="py-8 sm:py-12">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center sm:flex-row sm:items-center sm:gap-5 sm:p-8 sm:text-right">
        <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
        <div className="w-full space-y-2">
          <Skeleton className="mx-auto h-6 w-40 sm:mx-0" />
          <Skeleton className="mx-auto h-4 w-32 sm:mx-0" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>

      <div className="mt-10">
        <Skeleton className="mb-4 h-5 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    </Container>
  );
}
