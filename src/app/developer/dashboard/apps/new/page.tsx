"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  UploadCloud,
  Send,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  FileArchive,
  X,
} from "lucide-react";
import { categories } from "@/data/categories";
import { createClient } from "@/lib/supabase/client";

const MAX_APK_SIZE = 50 * 1024 * 1024; // matches the sanadak-apks bucket limit

function slugify(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "app"}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadZone({ label, hint }: { label: string; hint: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-navy">{label}</label>
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center transition-colors hover:border-primary/40">
        <UploadCloud className="h-7 w-7 text-slate-400" />
        <p className="text-xs text-slate-500">{hint}</p>
        <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
          اختر ملفًا
        </span>
      </div>
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

export default function AddAppPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [version, setVersion] = useState("");
  const [size, setSize] = useState("");
  const [apkFile, setApkFile] = useState<File | null>(null);
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!apkFile) {
      setError("يرجى اختيار ملف APK قبل الإرسال.");
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

    const slug = slugify(name);
    const apkPath = `${user.id}/${slug}.apk`;

    const { error: uploadError } = await supabase.storage
      .from("sanadak-apks")
      .upload(apkPath, apkFile, {
        contentType: "application/vnd.android.package-archive",
      });

    if (uploadError) {
      setLoading(false);
      setError("تعذر رفع ملف APK، حاول مرة أخرى.");
      return;
    }

    const shortDescription =
      description.length > 140 ? `${description.slice(0, 137)}...` : description;

    const { error: insertError } = await supabase.from("apps").insert({
      slug,
      name,
      developer_id: user.id,
      category_slug: categorySlug,
      short_description: shortDescription,
      description,
      version,
      size,
      apk_path: apkPath,
    });

    setLoading(false);

    if (insertError) {
      await supabase.storage.from("sanadak-apks").remove([apkPath]);
      setError("تعذر إرسال التطبيق للمراجعة، حاول مرة أخرى.");
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
          تم رفع ملف APK بنجاح، وسيقوم فريق سندك بمراجعة تطبيقك، وسيظهر ضمن قائمة &quot;قيد المراجعة&quot; حتى تتم الموافقة عليه.
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <UploadZone label="شعار التطبيق" hint="PNG أو JPG (512×512)" />
          <UploadZone label="Screenshots" hint="حتى 5 صور" />
          <ApkUploadZone
            file={apkFile}
            onSelect={handleApkSelect}
            onClear={() => setApkFile(null)}
          />
        </div>

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
          {loading ? "جارٍ الرفع والإرسال..." : "إرسال للمراجعة"}
        </button>
      </form>
    </div>
  );
}
