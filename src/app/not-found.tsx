import Link from "next/link";
import { SearchX } from "lucide-react";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <SearchX className="h-8 w-8" />
      </span>
      <h1 className="text-2xl font-extrabold text-navy">الصفحة غير موجودة</h1>
      <p className="max-w-sm text-sm text-slate-500">
        عذرًا، لم نتمكن من العثور على ما تبحث عنه.
      </p>
      <Link
        href="/"
        className="mt-2 flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary-dark"
      >
        العودة للرئيسية
      </Link>
    </Container>
  );
}
