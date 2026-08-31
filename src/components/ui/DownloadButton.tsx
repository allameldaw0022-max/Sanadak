"use client";

import { useState } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DownloadButton({
  size = "lg",
  className,
}: {
  size?: "lg" | "md";
  className?: string;
}) {
  const [clicked, setClicked] = useState(false);

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        onClick={() => setClicked(true)}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-white shadow-sm transition-colors hover:bg-primary-dark active:bg-primary-dark",
          size === "lg" ? "h-14 text-base sm:text-lg" : "h-11 text-sm"
        )}
      >
        <Download className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
        تحميل APK
      </button>
      {clicked && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          نسخة تجريبية — سيتم تفعيل التحميل الفعلي قريبًا
        </p>
      )}
    </div>
  );
}
