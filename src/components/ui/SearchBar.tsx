"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBar({
  defaultValue = "",
  placeholder = "ابحث عن تطبيق...",
  className,
  autoFocus,
}: {
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute top-1/2 right-4 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-sm text-navy placeholder:text-slate-400 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
      />
    </form>
  );
}
