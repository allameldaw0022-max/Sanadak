import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AccountLoading() {
  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto max-w-md">
        <Skeleton className="h-40 rounded-2xl" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>
    </Container>
  );
}
