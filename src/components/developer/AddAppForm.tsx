"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent, type FormEvent } from "react";
import {
  UploadCloud,
  Send,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  FileArchive,
  X,
  ArrowUp,
  ArrowDown,
  ImagePlus,
} from "lucide-react";
import { categories } from "@/data/categories";
import { createClient } from "@/lib/supabase/client";
import { submitNewAppAction } from "@/app/developer/dashboard/apps/new/actions";
import { cn } from "@/lib/utils";

const MAX_APK_SIZE = 50 * 1024 * 1024; // matches the sanadak-apks bucket limit
const MAX_ICON_SIZE = 2 * 1024 * 1024;
const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024;
const MAX_SCREENSHOTS = 5;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Fast, non-authoritative pre-check so the developer gets instant feedback
// without waiting on a round trip — the server always re-validates every
// file by its real bytes (see src/lib/uploads/image-validation.ts), which
// is the check that actually matters.
function quickImageCheck(file: File, maxBytes: number): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "الصورة يجب أن تكون PNG أو JPG أو WebP.";
  if (file.size > maxBytes) return `حجم الصورة يجب ألا يتجاوز ${(maxBytes / (1024 * 1024)).toFixed(0)}MB.`;
  return null;
}

type Screenshot = { id: string; file: File; previewUrl: string };

function IconUploadZone({
  previewUrl,
  fileName,
  onSelect,
  onClear,
  error,
}: {
  previewUrl: string | null;
  fileName: string | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onSelect(file);
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-navy">شعار التطبيق</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) onSelect(selected);
          e.target.value = "";
        }}
      />

      {previewUrl ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-primary/40 bg-primary-light/40 px-4 py-6 text-center">
          <Image
            src={previewUrl}
            alt="معاينة الشعار"
            width={80}
            height={80}
            unoptimized
            className="h-20 w-20 rounded-2xl object-cover shadow-sm"
          />
          {fileName && <p className="max-w-full truncate px-2 text-[11px] text-slate-500">{fileName}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              استبدال
            </button>
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600"
            >
              <X className="h-3.5 w-3.5" />
              إزالة
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
            dragOver ? "border-primary bg-primary-light/40" : "border-slate-200 bg-slate-50 hover:border-primary/40"
          )}
        >
          <UploadCloud className="h-7 w-7 text-slate-400" />
          <p className="text-xs text-slate-500">اسحب الصورة هنا أو اختر صورة</p>
          <p className="text-[11px] text-slate-400">PNG أو JPG أو WebP، حتى 2MB</p>
          <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
            اختر ملفًا
          </span>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function ScreenshotsUploadZone({
  screenshots,
  onAdd,
  onRemove,
  onMove,
  error,
}: {
  screenshots: Screenshot[];
  onAdd: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) onAdd(e.dataTransfer.files);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="block text-sm font-semibold text-navy">لقطات الشاشة (Screenshots)</label>
        <span className="text-xs text-slate-400">{screenshots.length}/{MAX_SCREENSHOTS}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onAdd(e.target.files);
          e.target.value = "";
        }}
      />

      {screenshots.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {screenshots.map((shot, i) => (
            <div key={shot.id} className="relative rounded-xl border border-slate-200 bg-slate-50 p-2">
              <Image
                src={shot.previewUrl}
                alt={`لقطة شاشة ${i + 1}`}
                width={160}
                height={284}
                unoptimized
                className="aspect-[9/16] w-full rounded-lg object-cover"
              />
              <div className="mt-1.5 flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => onMove(shot.id, "up")}
                    className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 disabled:opacity-30"
                    aria-label="تحريك لأعلى"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    disabled={i === screenshots.length - 1}
                    onClick={() => onMove(shot.id, "down")}
                    className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 disabled:opacity-30"
                    aria-label="تحريك لأسفل"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(shot.id)}
                  className="rounded-md border border-red-200 bg-white p-1 text-red-600"
                  aria-label="حذف"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {screenshots.length < MAX_SCREENSHOTS && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
            dragOver ? "border-primary bg-primary-light/40" : "border-slate-200 bg-slate-50 hover:border-primary/40"
          )}
        >
          <ImagePlus className="h-7 w-7 text-slate-400" />
          <p className="text-xs text-slate-500">اسحب الصور هنا أو اختر صورًا (يمكن اختيار عدة صور)</p>
          <p className="text-[11px] text-slate-400">حتى {MAX_SCREENSHOTS} صور، PNG/JPG/WebP، 5MB لكل صورة</p>
          <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
            + إضافة لقطات الشاشة
          </span>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function ApkUploadZone({
  file,
  onSelect,
  onClear,
}: {
  file: File | null;
  onSelect: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-navy">ملف APK</label>
      <input
        ref={inputRef}
        type="file"
        accept=".apk"
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) onSelect(selected);
          e.target.value = "";
        }}
      />

      {file ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-primary/40 bg-primary-light/40 px-4 py-8 text-center">
          <FileArchive className="h-7 w-7 text-primary-dark" />
          <p className="max-w-full truncate px-2 text-xs font-semibold text-navy">{file.name}</p>
          <p className="text-[11px] text-slate-500">{formatFileSize(file.size)}</p>
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600"
          >
            <X className="h-3.5 w-3.5" />
            إزالة
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center transition-colors hover:border-primary/40">
          <UploadCloud className="h-7 w-7 text-slate-400" />
          <p className="text-xs text-slate-500">حتى 50 ميجابايت</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500"
          >
            اختر ملفًا
          </button>
        </div>
      )}
    </div>
  );
}

export function AddAppForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [version, setVersion] = useState("");
  const [size, setSize] = useState("");
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string | null>(null);
  const [iconError, setIconError] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [screenshotsError, setScreenshotsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleApkSelect(file: File) {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".apk")) {
      setError("الملف يجب أن يكون بصيغة APK.");
      return;
    }
    if (file.size > MAX_APK_SIZE) {
      setError("حجم ملف APK يجب ألا يتجاوز 50 ميجابايت.");
      return;
    }
    setApkFile(file);
  }

  function handleIconSelect(file: File) {
    setIconError(quickImageCheck(file, MAX_ICON_SIZE));
    if (iconPreviewUrl) URL.revokeObjectURL(iconPreviewUrl);
    setIconFile(file);
    setIconPreviewUrl(URL.createObjectURL(file));
  }

  function handleIconClear() {
    if (iconPreviewUrl) URL.revokeObjectURL(iconPreviewUrl);
    setIconFile(null);
    setIconPreviewUrl(null);
    setIconError(null);
  }

  function handleScreenshotsAdd(files: FileList | File[]) {
    const incoming = Array.from(files);
    const remainingSlots = MAX_SCREENSHOTS - screenshots.length;
    if (incoming.length > remainingSlots) {
      setScreenshotsError(`يمكنك إضافة ${remainingSlots} صورة إضافية فقط (الحد الأقصى ${MAX_SCREENSHOTS}).`);
    } else {
      setScreenshotsError(null);
    }
    const accepted = incoming.slice(0, remainingSlots);
    for (const file of accepted) {
      const quickError = quickImageCheck(file, MAX_SCREENSHOT_SIZE);
      if (quickError) {
        setScreenshotsError(quickError);
        continue;
      }
      setScreenshots((prev) => [
        ...prev,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file, previewUrl: URL.createObjectURL(file) },
      ]);
    }
  }

  function handleScreenshotRemove(id: string) {
    setScreenshots((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((s) => s.id !== id);
    });
  }

  function handleScreenshotMove(id: string, direction: "up" | "down") {
    setScreenshots((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!apkFile) {
      setError("يرجى اختيار ملف APK قبل الإرسال.");
      return;
    }
    if (iconError) {
      setError("يرجى تصحيح خطأ شعار التطبيق قبل الإرسال.");
      return;
    }
    if (screenshotsError) {
      setError("يرجى تصحيح خطأ لقطات الشاشة قبل الإرسال.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setError("يجب تسجيل الدخول أولًا.");
      return;
    }

    const uploadUrlRes = await fetch("/api/r2/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: apkFile.name }),
    });

    if (!uploadUrlRes.ok) {
      setLoading(false);
      setError("تعذر تجهيز رفع ملف APK، حاول مرة أخرى.");
      return;
    }

    const { uploadUrl, key: apkPath } = await uploadUrlRes.json();

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/vnd.android.package-archive" },
      body: apkFile,
    });

    if (!uploadRes.ok) {
      setLoading(false);
      setError("تعذر رفع ملف APK، حاول مرة أخرى.");
      return;
    }

    // The rest of the pipeline (validating/uploading the icon and
    // screenshots, creating the app row, and running the server-side
    // security scan) happens in a Server Action — the browser never gets
    // to decide security_status, skip the scan, or claim a file is an
    // image without the server checking its real bytes.
    const result = await submitNewAppAction({
      name,
      description,
      categorySlug,
      version,
      size,
      apkPath,
      iconFile,
      screenshotFiles: screenshots.map((s) => s.file),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSubmitted(true);
    router.refresh();
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
        <CheckCircle2 className="h-12 w-12 text-primary" />
        <h1 className="text-lg font-extrabold text-navy">تم إرسال تطبيقك للمراجعة</h1>
        <p className="max-w-sm text-sm text-slate-500">
          تم رفع ملف APK وإجراء فحص أمني أولي عليه تلقائيًا. سيظهر تطبيقك للمستخدمين فقط بعد اجتياز الفحص الأمني
          واعتماد فريق سندك له إداريًا. يمكنك متابعة حالة الفحص من لوحة التحكم.
        </p>
        <Link
          href="/developer/dashboard"
          className="mt-3 flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary-dark"
        >
          العودة للوحة التحكم
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">إضافة تطبيق جديد</h1>
        <p className="mt-1 text-sm text-slate-500">
          أدخل بيانات تطبيقك ليتم مراجعتها ونشرها على سندك
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
      >
        <div>
          <label htmlFor="app-name" className="mb-1.5 block text-sm font-semibold text-navy">
            اسم التطبيق
          </label>
          <input
            id="app-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: سوق السودان"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label htmlFor="app-desc" className="mb-1.5 block text-sm font-semibold text-navy">
            وصف التطبيق
          </label>
          <textarea
            id="app-desc"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اكتب وصفًا مختصرًا وواضحًا عن تطبيقك ووظائفه"
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="app-category" className="mb-1.5 block text-sm font-semibold text-navy">
              التصنيف
            </label>
            <select
              id="app-category"
              required
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            >
              <option value="" disabled>
                اختر التصنيف
              </option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="app-version" className="mb-1.5 block text-sm font-semibold text-navy">
              الإصدار
            </label>
            <input
              id="app-version"
              type="text"
              required
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.0"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="app-size" className="mb-1.5 block text-sm font-semibold text-navy">
              حجم التطبيق
            </label>
            <input
              id="app-size"
              type="text"
              required
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="25 MB"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <IconUploadZone
            previewUrl={iconPreviewUrl}
            fileName={iconFile?.name ?? null}
            onSelect={handleIconSelect}
            onClear={handleIconClear}
            error={iconError}
          />
          <ApkUploadZone file={apkFile} onSelect={handleApkSelect} onClear={() => setApkFile(null)} />
        </div>

        <ScreenshotsUploadZone
          screenshots={screenshots}
          onAdd={handleScreenshotsAdd}
          onRemove={handleScreenshotRemove}
          onMove={handleScreenshotMove}
          error={screenshotsError}
        />

        {error && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60 sm:w-auto sm:px-8"
        >
          <Send className="h-4 w-4" />
          {loading ? "جارٍ رفع الملفات والفحص والإرسال..." : "إرسال للمراجعة"}
        </button>
      </form>
    </div>
  );
}
