import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DevicesLoading() {
  return (
    <Container className="py-8 sm:py-12">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-64" />

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </Container>
  );
}
