import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SearchLoading() {
  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto max-w-xl text-center">
        <Skeleton className="mx-auto h-7 w-40" />
        <Skeleton className="mx-auto mt-2 h-4 w-56" />
        <Skeleton className="mx-auto mt-6 h-12 w-full rounded-xl" />
      </div>
    </Container>
  );
}
