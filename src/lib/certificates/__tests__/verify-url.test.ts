import { describe, expect, it } from "vitest";
import { createScanOnceGuard, extractCertificateIdFromScan } from "../verify-url";

const ORIGIN = "https://sanadk.men";
const VALID_ID = "a1b2c3d4-e5f6-4789-90ab-cdef01234567";

describe("extractCertificateIdFromScan", () => {
  it("accepts a valid Sanadak verification URL", () => {
    expect(extractCertificateIdFromScan(`${ORIGIN}/verify/${VALID_ID}`, ORIGIN)).toBe(VALID_ID);
  });

  it("is case-insensitive on the certificate id", () => {
    expect(extractCertificateIdFromScan(`${ORIGIN}/verify/${VALID_ID.toUpperCase()}`, ORIGIN)).toBe(
      VALID_ID.toUpperCase()
    );
  });

  it("trims surrounding whitespace", () => {
    expect(extractCertificateIdFromScan(`  ${ORIGIN}/verify/${VALID_ID}  `, ORIGIN)).toBe(VALID_ID);
  });

  it("rejects plain text that isn't a URL at all", () => {
    expect(extractCertificateIdFromScan("hello world", ORIGIN)).toBeNull();
  });

  it("rejects an empty string", () => {
    expect(extractCertificateIdFromScan("", ORIGIN)).toBeNull();
  });

  it("rejects a well-formed but arbitrary external URL", () => {
    expect(extractCertificateIdFromScan(`https://evil.com/verify/${VALID_ID}`, ORIGIN)).toBeNull();
  });

  it("rejects an external URL that merely resembles the certificate path", () => {
    expect(extractCertificateIdFromScan(`https://sanadk.men.evil.com/verify/${VALID_ID}`, ORIGIN)).toBeNull();
  });

  it("rejects a same-origin URL with a malformed certificate id", () => {
    expect(extractCertificateIdFromScan(`${ORIGIN}/verify/not-a-real-id`, ORIGIN)).toBeNull();
  });

  it("rejects a same-origin URL with a short/truncated id", () => {
    expect(extractCertificateIdFromScan(`${ORIGIN}/verify/123`, ORIGIN)).toBeNull();
  });

  it("rejects a same-origin URL pointing somewhere other than /verify", () => {
    expect(extractCertificateIdFromScan(`${ORIGIN}/devices/${VALID_ID}`, ORIGIN)).toBeNull();
  });

  it("rejects a same-origin URL with an extra path segment after the id", () => {
    expect(extractCertificateIdFromScan(`${ORIGIN}/verify/${VALID_ID}/extra`, ORIGIN)).toBeNull();
  });

  it("rejects a scheme-relative/javascript payload", () => {
    expect(extractCertificateIdFromScan("javascript:alert(1)", ORIGIN)).toBeNull();
  });

  it("ignores a query string or fragment appended to an otherwise valid link", () => {
    // Not part of the expected format at all -- the path must match exactly.
    expect(extractCertificateIdFromScan(`${ORIGIN}/verify/${VALID_ID}?x=1`, ORIGIN)).toBeNull();
  });
});

describe("createScanOnceGuard", () => {
  it("returns true on the first call", () => {
    const guard = createScanOnceGuard();
    expect(guard()).toBe(true);
  });

  it("returns false on every call after the first", () => {
    const guard = createScanOnceGuard();
    guard();
    expect(guard()).toBe(false);
    expect(guard()).toBe(false);
  });

  it("tracks state independently per guard instance", () => {
    const guardA = createScanOnceGuard();
    const guardB = createScanOnceGuard();
    expect(guardA()).toBe(true);
    expect(guardB()).toBe(true);
  });
});
