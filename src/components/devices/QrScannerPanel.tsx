"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, RefreshCw, ScanLine, ShieldAlert, X } from "lucide-react";
import { createScanOnceGuard, extractCertificateIdFromScan } from "@/lib/certificates/verify-url";
import { cn } from "@/lib/utils";
import type QrScannerType from "qr-scanner";

type ScannerState = "idle" | "starting" | "scanning" | "permission-denied" | "unsupported" | "camera-error";

// Camera access is requested ONLY when the user presses "امسح رمز QR
// بالكاميرا" below (startScanning) -- nothing in this component touches
// navigator.mediaDevices before that, and the qr-scanner library itself is
// lazy-loaded at that same moment (never in the initial page bundle).
//
// Every decoded frame goes through extractCertificateIdFromScan before
// anything happens: a code that isn't one of our own /verify/<id> links is
// treated as "not a Sanadak certificate" and scanning simply continues --
// it is never passed to router.push, matching the same never-trust-scanned-
// content rule the rest of the app already applies to any external input.
export function QrScannerPanel() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScannerType | null>(null);
  const claimFirstRef = useRef(createScanOnceGuard());
  const [state, setState] = useState<ScannerState>("idle");
  const [showInvalidHint, setShowInvalidHint] = useState(false);

  function teardown() {
    scannerRef.current?.stop();
    scannerRef.current?.destroy();
    scannerRef.current = null;
  }

  // Stops the camera if the user navigates away or closes the tab while
  // scanning is active -- not just on the explicit "إيقاف الكاميرا" click.
  useEffect(() => teardown, []);

  useEffect(() => {
    if (!showInvalidHint) return;
    const t = setTimeout(() => setShowInvalidHint(false), 3000);
    return () => clearTimeout(t);
  }, [showInvalidHint]);

  async function startScanning() {
    setState("starting");
    setShowInvalidHint(false);
    claimFirstRef.current = createScanOnceGuard();

    const { default: QrScanner } = await import("qr-scanner");

    const hasCamera = await QrScanner.hasCamera().catch(() => false);
    if (!hasCamera || !videoRef.current) {
      setState("unsupported");
      return;
    }

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        const certificateId = extractCertificateIdFromScan(result.data, window.location.origin);
        if (!certificateId) {
          setShowInvalidHint(true);
          return;
        }
        if (!claimFirstRef.current()) return;
        teardown();
        setState("idle");
        router.push(`/verify/${certificateId}`);
      },
      { preferredCamera: "environment", highlightScanRegion: true, highlightCodeOutline: true }
    );
    scannerRef.current = scanner;

    try {
      await scanner.start();
      setState("scanning");
    } catch (err) {
      teardown();
      setState(err instanceof DOMException && err.name === "NotAllowedError" ? "permission-denied" : "camera-error");
    }
  }

  function stopScanning() {
    teardown();
    setState("idle");
    setShowInvalidHint(false);
  }

  const isVideoVisible = state === "scanning" || state === "starting";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
          <ScanLine className="h-4.5 w-4.5" />
        </span>
        <h2 className="text-sm font-extrabold text-navy">امسح رمز QR</h2>
      </div>

      <div
        className={cn(
          "relative mt-4 overflow-hidden rounded-xl bg-slate-900",
          isVideoVisible ? "block aspect-square w-full max-w-xs mx-auto" : "hidden"
        )}
      >
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {state === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 text-xs font-semibold text-white">
            جارٍ تشغيل الكاميرا...
          </div>
        )}
      </div>

      {state === "scanning" && (
        <>
          <p className="mt-3 text-center text-xs text-slate-500">وجّه الكاميرا نحو رمز QR الموجود على الشهادة.</p>
          {showInvalidHint && (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs font-medium text-amber-700">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              هذا الرمز ليس رمز تحقق صادرًا عن سندك.
            </p>
          )}
          <button
            type="button"
            onClick={stopScanning}
            className="mx-auto mt-3 flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <X className="h-3.5 w-3.5" />
            إيقاف الكاميرا
          </button>
        </>
      )}

      {(state === "idle" || state === "starting") && (
        <div className="mt-4">
          <button
            type="button"
            onClick={startScanning}
            disabled={state === "starting"}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            <Camera className="h-4 w-4" />
            {state === "starting" ? "جارٍ تشغيل الكاميرا..." : "امسح رمز QR بالكاميرا"}
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            سنطلب إذن الوصول إلى الكاميرا لقراءة الرمز فقط، ولن يتم حفظ أو رفع أي صورة.
          </p>
        </div>
      )}

      {state === "permission-denied" && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
          <p className="text-xs font-semibold text-amber-800">
            تم رفض إذن الوصول إلى الكاميرا. يمكنك السماح به من إعدادات المتصفح، أو إدخال معرّف الشهادة يدويًا أدناه.
          </p>
          <button
            type="button"
            onClick={startScanning}
            className="mx-auto mt-2 flex h-9 items-center gap-1.5 rounded-lg bg-navy px-4 text-xs font-bold text-white transition-colors hover:bg-slate-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            حاول مرة أخرى
          </button>
        </div>
      )}

      {state === "unsupported" && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs font-semibold text-slate-600">
            متصفحك أو جهازك لا يدعم مسح رمز QR من هنا حاليًا. يمكنك إدخال معرّف الشهادة يدويًا أدناه.
          </p>
        </div>
      )}

      {state === "camera-error" && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center">
          <p className="text-xs font-semibold text-red-700">تعذر تشغيل الكاميرا، حاول مرة أخرى.</p>
          <button
            type="button"
            onClick={startScanning}
            className="mx-auto mt-2 flex h-9 items-center gap-1.5 rounded-lg bg-navy px-4 text-xs font-bold text-white transition-colors hover:bg-slate-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            حاول مرة أخرى
          </button>
        </div>
      )}
    </div>
  );
}
