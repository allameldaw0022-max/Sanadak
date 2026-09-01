"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, UploadCloud } from "lucide-react";
import { submitReportEvidenceAction } from "@/app/devices/reports/actions";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

function quickCheck(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "الصورة يجب أن تكون PNG أو JPG أو WebP.";
  if (file.size > MAX_SIZE) return "حجم الصورة يجب ألا يتجاوز 5 ميجابايت.";
  return null;
}

export function ReportEvidenceUpload({ reportId }: { reportId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFile(file: File) {
    setError(null);
    const quickError = quickCheck(file);
    if (quickError) {
      setError(quickError);
      return;
    }

    startTransition(async () => {
      const result = await submitReportEvidenceAction(reportId, file);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragOver ? "border-primary bg-primary-light/40" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
        }`}
      >
        <UploadCloud className="h-6 w-6 text-slate-400" />
        <p className="text-xs font-semibold text-slate-500">
          {pending ? "جارٍ الرفع..." : "اضغط أو اسحب صورة الدليل هنا"}
        </p>
      </div>

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
