import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CategoriesLoading() {
  return (
    <Container className="py-8 sm:py-12">
      <div className="mb-8">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5"
          >
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    </Container>
  );
}
