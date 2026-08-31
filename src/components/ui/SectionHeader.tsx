import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function SectionHeader({
  title,
  subtitle,
  href,
  hrefLabel = "عرض الكل",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-extrabold text-navy sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary hover:text-primary-dark"
        >
          {hrefLabel}
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
