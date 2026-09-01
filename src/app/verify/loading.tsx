import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function VerifyLoading() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
        <Skeleton className="mx-auto h-14 w-14 rounded-2xl" />
        <Skeleton className="mx-auto mt-4 h-7 w-48" />
        <Skeleton className="mx-auto mt-2 h-4 w-64" />
        <Skeleton className="mt-8 h-32 rounded-2xl" />
      </div>
    </Container>
  );
}
