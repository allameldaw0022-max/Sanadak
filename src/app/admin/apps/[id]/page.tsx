import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck, ShieldQuestion, ShieldOff, ShieldAlert } from "lucide-react";
import { AppIcon } from "@/components/ui/AppIcon";
import { StatusBadge } from "@/components/ui/Badge";
import { SecurityStatusBadge, RiskLevelBadge } from "@/components/ui/SecurityStatusBadge";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { RejectAppButton } from "@/components/admin/RejectAppButton";
import { SecurityReasonButton } from "@/components/admin/SecurityReasonButton";
import { getAdminAppById, getAppSecurityInfo } from "@/lib/supabase/queries";
import { formatDate, formatDateTime } from "@/lib/utils";
import { approveAppAction } from "@/app/admin/actions";
import {
  approveSecurityAction,
  rejectSecurityAction,
  requestSecurityReviewAction,
  emergencyDisableAction,
  emergencyReenableAction,
} from "@/app/admin/security/actions";

export const metadata: Metadata = {
  title: "مراجعة تطبيق | سندك",
};

export default async function AdminAppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [app, security] = await Promise.all([getAdminAppById(id), getAppSecurityInfo(id)]);
  if (!app) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/apps"
        className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy"
      >
        <ArrowRight className="h-4 w-4" />
        العودة لكل التطبيقات
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <AppIcon name={app.name} color={app.iconColor} size="md" />
            <div>
              <h1 className="text-xl font-extrabold text-navy">{app.name}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {app.developerName}
                {app.developerEmail ? ` · ${app.developerEmail}` : ""}
              </p>
              <div className="mt-2">
                <StatusBadge status={app.status} />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            {app.status !== "approved" && (
              <form action={approveAppAction}>
                <input type="hidden" name="appId" value={app.id} />
                <button
                  type="submit"
                  className="flex h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  اعتماد التطبيق
                </button>
              </form>
            )}
            {app.status !== "rejected" && (
              <RejectAppButton
                appId={app.id}
                className="flex h-11 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
              />
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-bold text-navy">الوصف</h2>
            <p className="text-sm leading-relaxed text-slate-600">{app.description}</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">التصنيف</span>
              <span className="font-semibold text-navy">{app.categoryName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">الإصدار</span>
              <span className="font-semibold text-navy">{app.version}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">حجم APK</span>
              <span className="font-semibold text-navy">{app.size}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Screenshots</span>
              <span className="font-semibold text-navy">{app.screenshotsCount}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">تاريخ الرفع</span>
              <span className="font-semibold text-navy">{formatDate(app.createdAt)}</span>
            </div>
            {app.reviewedAt && (
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">تاريخ المراجعة</span>
                <span className="font-semibold text-navy">{formatDate(app.reviewedAt)}</span>
              </div>
            )}
            {app.reviewerName && (
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">تمت المراجعة بواسطة</span>
                <span className="font-semibold text-navy">{app.reviewerName}</span>
              </div>
            )}
          </div>
        </div>

        {app.status === "rejected" && app.rejectionReason && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-bold text-red-700">سبب الرفض</p>
            <p className="mt-1 text-sm text-red-600">{app.rejectionReason}</p>
          </div>
        )}

        <div className="mt-8 border-t border-slate-100 pt-6">
          <h2 className="mb-3 text-sm font-bold text-navy">ملف APK</h2>
          <div className="max-w-xs">
            <DownloadButton appId={app.id} apkPath={app.apkPath} size="md" />
          </div>
        </div>

        {security && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-navy">الفحص الأمني</h2>
              <div className="flex items-center gap-2">
                <SecurityStatusBadge status={security.securityStatus} />
                {security.latestScan && <RiskLevelBadge level={security.latestScan.riskLevel} />}
              </div>
            </div>

            {security.emergencyDisabled && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold text-red-700">
                  <ShieldOff className="h-3.5 w-3.5" />
                  تم إيقاف هذا التطبيق بشكل طارئ
                </p>
                <p className="mt-1 text-sm text-red-600">{security.emergencyDisabledReason}</p>
                {security.emergencyDisabledAt && (
                  <p className="mt-1 text-xs text-red-500">{formatDateTime(security.emergencyDisabledAt)}</p>
                )}
              </div>
            )}

            {security.latestScan ? (
              <>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Package name</span>
                    <span className="font-mono text-xs font-semibold text-navy" dir="ltr">
                      {security.latestScan.packageName ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">الإصدار</span>
                    <span className="font-semibold text-navy">
                      {security.latestScan.versionName ?? "—"} ({security.latestScan.versionCode ?? "—"})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">SHA-256</span>
                    <span className="max-w-[60%] truncate font-mono text-[11px] text-navy" dir="ltr">
                      {security.latestScan.sha256}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">min/target SDK</span>
                    <span className="font-semibold text-navy">
                      {security.latestScan.minSdk ?? "—"} / {security.latestScan.targetSdk ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">حجم الملف</span>
                    <span className="font-semibold text-navy">
                      {(security.latestScan.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">التوقيع الرقمي</span>
                    <span className="font-semibold text-navy">
                      {security.latestScan.isSigned ? `موقّع (${security.latestScan.signatureScheme})` : "غير موقّع"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">certificate fingerprint</span>
                    <span className="max-w-[60%] truncate font-mono text-[11px] text-navy" dir="ltr">
                      {security.latestScan.certificateFingerprint ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">فحص Malware</span>
                    <span className="font-semibold text-navy">
                      {security.latestScan.malwareProvider
                        ? `${security.latestScan.malwareProvider}: ${security.latestScan.malwareStatus}`
                        : security.latestScan.malwareStatus}
                    </span>
                  </div>
                </div>

                {security.latestScan.permissions.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-xs font-bold text-navy">الصلاحيات (Permissions)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {security.latestScan.permissions.map((p) => (
                        <span key={p} className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {security.latestScan.exportedComponents.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-xs font-bold text-navy">مكوّنات مُصدَّرة (exported)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {security.latestScan.exportedComponents.map((c) => (
                        <span key={c} className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {security.latestScan.findings.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-xs font-bold text-navy">نتائج الفحص (Findings)</p>
                    <ul className="space-y-1.5">
                      {security.latestScan.findings.map((f) => (
                        <li
                          key={f.code}
                          className="flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700"
                        >
                          <ShieldAlert
                            className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                              f.severity === "critical" || f.severity === "high" ? "text-red-500" : "text-amber-500"
                            }`}
                          />
                          {f.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">لم يُجرَ فحص أمني لهذا التطبيق بعد.</p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {security.securityStatus !== "passed" && (
                <form action={approveSecurityAction}>
                  <input type="hidden" name="appId" value={app.id} />
                  <button
                    type="submit"
                    className="flex h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    اعتماد أمنيًا
                  </button>
                </form>
              )}
              {security.securityStatus !== "review_required" && (
                <form action={requestSecurityReviewAction}>
                  <input type="hidden" name="appId" value={app.id} />
                  <button
                    type="submit"
                    className="flex h-11 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-5 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100"
                  >
                    <ShieldQuestion className="h-4 w-4" />
                    طلب مراجعة
                  </button>
                </form>
              )}
              {security.securityStatus !== "failed" && (
                <SecurityReasonButton
                  appId={app.id}
                  action={rejectSecurityAction}
                  icon={ShieldOff}
                  label="رفض أمنيًا"
                  dialogTitle="سبب الرفض الأمني"
                  dialogHint="سيُمنع نشر هذا التطبيق حتى تتم إعادة رفعه وفحصه من جديد."
                  confirmLabel="تأكيد الرفض"
                  placeholder="اكتب سببًا واضحًا للرفض الأمني..."
                  className="flex h-11 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
                />
              )}
              {security.emergencyDisabled ? (
                <form action={emergencyReenableAction}>
                  <input type="hidden" name="appId" value={app.id} />
                  <button
                    type="submit"
                    className="flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    إلغاء الإيقاف الطارئ
                  </button>
                </form>
              ) : (
                <SecurityReasonButton
                  appId={app.id}
                  action={emergencyDisableAction}
                  icon={ShieldOff}
                  label="🚨 إيقاف فوري"
                  dialogTitle="إيقاف التطبيق بشكل طارئ"
                  dialogHint="سيختفي التطبيق فورًا من المتجر ويُمنع تحميله حتى تُلغي الإيقاف."
                  confirmLabel="تأكيد الإيقاف الفوري"
                  placeholder="اكتب سبب الإيقاف الطارئ..."
                  className="flex h-11 items-center gap-1.5 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition-colors hover:bg-red-700"
                  confirmClassName="bg-red-600 hover:bg-red-700"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
