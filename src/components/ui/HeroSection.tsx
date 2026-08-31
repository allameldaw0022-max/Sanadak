import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { Container } from "./Container";

export function HeroSection() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <Container className="flex flex-col items-center gap-6 py-12 text-center sm:py-16">
        <span className="rounded-full bg-primary-light px-4 py-1.5 text-xs font-semibold text-primary-dark sm:text-sm">
          🇸🇩 صُنع للمستخدم السوداني
        </span>
        <h1 className="max-w-2xl text-balance text-3xl font-extrabold leading-tight text-navy sm:text-4xl md:text-5xl">
          كل التطبيقات السودانية في مكان واحد
        </h1>
        <p className="max-w-xl text-balance text-sm leading-relaxed text-slate-500 sm:text-base">
          اكتشف التطبيقات السودانية وحمّلها بسهولة من مكان واحد.
        </p>

        <div className="flex w-full max-w-xl flex-col items-center gap-3 sm:flex-row">
          <SearchBar className="sm:flex-1" />
          <Link
            href="/apps"
            className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark sm:w-auto"
          >
            استكشف التطبيقات
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
