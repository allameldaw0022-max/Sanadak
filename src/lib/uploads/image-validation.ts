// Real content-based image validation. We never trust a client-supplied
// filename extension or MIME header — the type is determined solely from
// the file's actual leading bytes (its "magic number"), which is what
// keeps an HTML/JS/executable file (or an SVG, which is XML/markup and
// can carry <script>) from ever being accepted or served as an image:
// none of those byte sequences match a real PNG/JPEG/WebP signature.

export type ImageType = "png" | "jpeg" | "webp";

export function sniffImageType(buf: Buffer): ImageType | null {
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "png";
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "jpeg";
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export const IMAGE_CONTENT_TYPE: Record<ImageType, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export const IMAGE_EXTENSION: Record<ImageType, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
};

export type ImageValidationResult =
  | { ok: true; type: ImageType }
  | { ok: false; error: string };

export function validateImageFile(buf: Buffer, maxBytes: number, label: string): ImageValidationResult {
  if (buf.length === 0) return { ok: false, error: `${label}: الملف فارغ.` };
  if (buf.length > maxBytes) {
    return { ok: false, error: `${label}: يتجاوز الحجم المسموح به (${(maxBytes / (1024 * 1024)).toFixed(0)}MB).` };
  }
  const type = sniffImageType(buf);
  if (!type) {
    return { ok: false, error: `${label}: نوع الملف غير مدعوم (PNG أو JPG أو WebP فقط).` };
  }
  return { ok: true, type };
}
