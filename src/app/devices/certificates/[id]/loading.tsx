import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CertificateDetailLoading() {
  return (
    <Container className="py-8 sm:py-12">
      <Skeleton className="mb-5 h-4 w-20" />

      <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <Skeleton className="mx-auto h-14 w-14 rounded-2xl" />
        <Skeleton className="mx-auto mt-3 h-5 w-40" />
        <Skeleton className="mx-auto mt-2 h-6 w-28 rounded-full" />
        <Skeleton className="mx-auto mt-2 h-3 w-32" />
        <Skeleton className="mx-auto mt-5 h-48 w-48 rounded-xl" />
        <Skeleton className="mx-auto mt-3 h-3 w-56" />
        <Skeleton className="mt-3 h-11 w-full rounded-xl" />
      </div>
    </Container>
  );
}
