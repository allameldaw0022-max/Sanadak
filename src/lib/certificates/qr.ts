import "server-only";
import QRCode from "qrcode";

// Server-side QR generation only (the `qrcode` package's Node build, not
// its browser canvas API) -- the QR image is produced once when a
// certificate page renders and embedded as a data: URI, so nothing here
// ever calls out to a third-party QR-rendering service with the
// verification URL. The URL itself carries only a certificate id (no
// secret, no signing needed -- see verify_certificate's comment in the
// certificates_dealers migration).
export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { margin: 1, width: 240 });
}
