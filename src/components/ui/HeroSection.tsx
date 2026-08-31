import { SearchBar } from "./SearchBar";
import { Container } from "./Container";

export function HeroSection() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <Container className="flex flex-col items-center gap-3 py-7 text-center sm:py-9">
        <span className="rounded-full bg-primary-light px-4 py-1.5 text-xs font-semibold text-primary-dark sm:text-sm">
          🇸🇩 صُنع للمستخدم السوداني
        </span>
        <h1 className="max-w-2xl text-balance text-2xl font-extrabold leading-tight text-navy sm:text-3xl md:text-4xl">
          كل التطبيقات السودانية في مكان واحد
        </h1>

        <SearchBar className="mt-2 max-w-xl md:hidden" />
      </Container>
    </section>
  );
}
