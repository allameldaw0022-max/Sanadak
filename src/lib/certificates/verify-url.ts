// Pure, side-effect-free QR-scan validation. No DOM/browser API here (no
// `window`, no camera) -- kept separate from the scanner component so it's
// directly unit-testable and so the security-critical decision ("is this
// scanned text actually one of OUR certificate-verification links?") lives
// in one small, auditable place rather than inline inside UI code.
//
// This is the ONLY thing standing between "whatever text a QR code happens
// to decode to" and a router navigation -- a scanned code is never trusted
// beyond what this function explicitly allows through.

const CERTIFICATE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VERIFY_PATH_RE = /^\/verify\/([0-9a-f-]{36})$/i;

// Extracts a certificate id from scanned QR text, but ONLY if the text is
// an absolute URL whose origin matches `expectedOrigin` (pass
// window.location.origin from the caller -- kept as a parameter, not read
// internally, so this function stays pure and testable without a DOM) and
// whose path is exactly /verify/<uuid>. Anything else -- plain text, a
// malformed URL, a URL on a different domain, a Sanadak-shaped path with an
// invalid id -- returns null. Never throws.
export function extractCertificateIdFromScan(rawScannedText: string, expectedOrigin: string): string | null {
  const trimmed = rawScannedText.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.origin !== expectedOrigin) return null;
  // No extra query string or fragment -- the real generated link never has
  // one (see generateQrDataUrl's caller), so anything added on top is not
  // the expected shape, however harmless it would actually be.
  if (url.search !== "" || url.hash !== "") return null;

  const match = VERIFY_PATH_RE.exec(url.pathname);
  if (!match) return null;

  const certificateId = match[1];
  if (!CERTIFICATE_ID_RE.test(certificateId)) return null;

  return certificateId;
}

// A tiny one-shot latch: the first call returns true, every call after that
// returns false. Used to make sure a scan result that keeps firing (the
// scanner samples multiple frames per second) can only ever trigger one
// navigation, even under rapid repeated detections of the same code.
export function createScanOnceGuard(): () => boolean {
  let claimed = false;
  return () => {
    if (claimed) return false;
    claimed = true;
    return true;
  };
}
