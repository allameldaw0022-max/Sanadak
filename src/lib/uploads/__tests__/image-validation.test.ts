import { describe, expect, it } from "vitest";
import { sniffImageType, validateImageFile } from "../image-validation";

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const WEBP_HEADER = Buffer.concat([
  Buffer.from("RIFF", "ascii"),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from("WEBP", "ascii"),
]);

describe("sniffImageType", () => {
  it("recognizes a real PNG by its magic bytes", () => {
    expect(sniffImageType(PNG_HEADER)).toBe("png");
  });

  it("recognizes a real JPEG by its magic bytes", () => {
    expect(sniffImageType(JPEG_HEADER)).toBe("jpeg");
  });

  it("recognizes a real WebP by its RIFF/WEBP markers", () => {
    expect(sniffImageType(WEBP_HEADER)).toBe("webp");
  });

  it("rejects an SVG (XML markup, not a raster format) even with an image/svg+xml claim", () => {
    const svg = Buffer.from('<?xml version="1.0"?><svg onload="alert(1)"></svg>', "utf8");
    expect(sniffImageType(svg)).toBeNull();
  });

  it("rejects an HTML file disguised with a .png extension", () => {
    const html = Buffer.from("<html><body><script>alert(1)</script></body></html>", "utf8");
    expect(sniffImageType(html)).toBeNull();
  });

  it("rejects an ELF/executable file disguised as an image", () => {
    const elf = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00]);
    expect(sniffImageType(elf)).toBeNull();
  });

  it("rejects empty or too-short buffers", () => {
    expect(sniffImageType(Buffer.alloc(0))).toBeNull();
    expect(sniffImageType(Buffer.from([0x89, 0x50]))).toBeNull();
  });
});

describe("validateImageFile", () => {
  it("accepts a valid PNG under the size limit", () => {
    const result = validateImageFile(PNG_HEADER, 2 * 1024 * 1024, "شعار");
    expect(result.ok).toBe(true);
  });

  it("rejects a file over the size limit even if it's a real PNG", () => {
    const oversized = Buffer.concat([PNG_HEADER, Buffer.alloc(3 * 1024 * 1024)]);
    const result = validateImageFile(oversized, 2 * 1024 * 1024, "شعار");
    expect(result.ok).toBe(false);
  });

  it("rejects a non-image buffer regardless of size", () => {
    const result = validateImageFile(Buffer.from("not an image"), 2 * 1024 * 1024, "شعار");
    expect(result.ok).toBe(false);
  });
});
