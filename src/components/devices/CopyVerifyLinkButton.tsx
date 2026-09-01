"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyVerifyLinkButton({ url }: { url: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older WebViews / non-secure contexts inside a TWA
        // where navigator.clipboard may be unavailable.
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!ok) throw new Error("execCommand copy failed");
      }
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-colors",
          state === "copied"
            ? "border-primary/30 bg-primary-light text-primary-dark"
            : "border-slate-200 bg-white text-navy hover:bg-slate-50"
        )}
      >
        {state === "copied" ? (
          <>
            <Check className="h-4 w-4" />
            تم نسخ الرابط ✓
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            نسخ الرابط
          </>
        )}
      </button>
      {state === "error" && (
        <p className="mt-1.5 text-center text-xs text-red-500">
          تعذر نسخ الرابط تلقائيًا، انسخه يدويًا من الأعلى.
        </p>
      )}
    </div>
  );
}
