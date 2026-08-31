import type { ReactNode } from "react";
import { Container } from "./Container";

export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">{title}</h1>
        <p className="mt-1 text-xs text-slate-400">آخر تحديث: {updatedAt}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-600 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-navy [&_ul]:list-disc [&_ul]:pr-5 [&_ul]:space-y-1.5">
          {children}
        </div>
      </div>
    </Container>
  );
}
