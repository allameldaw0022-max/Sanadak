"use client";

import { useState } from "react";
import { Download, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function DownloadButton({
  appId,
  apkPath,
  size = "lg",
  className,
}: {
  appId: string;
  apkPath?: string | null;
  size?: "lg" | "md";
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "downloading" | "done" | "error">("idle");

  async function handleClick() {
    setStatus("downloading");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("app_downloads").insert({ app_id: appId, user_id: user?.id ?? null });

    if (!apkPath) {
      setStatus("done");
      return;
    }

    const { data, error } = await supabase.storage
      .from("sanadak-apks")
      .createSignedUrl(apkPath, 60);

    if (error || !data?.signedUrl) {
      setStatus("error");
      return;
    }

    window.location.href = data.signedUrl;
    setStatus("done");
  }

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "downloading"}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-white shadow-sm transition-colors hover:bg-primary-dark active:bg-primary-dark disabled:opacity-70",
          size === "lg" ? "h-14 text-base sm:text-lg" : "h-11 text-sm"
        )}
      >
        <Download className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
        {status === "downloading" ? "جارٍ التحضير..." : "تحميل APK"}
      </button>

      {status === "done" && !apkPath && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          نسخة تجريبية — لم يقم المطور برفع ملف APK فعلي بعد
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          تعذر تجهيز رابط التحميل، حاول مرة أخرى
        </p>
      )}
    </div>
  );
}
