import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { hashImei, imeiHashesMatch, isValidImei, isValidImeiLuhn, normalizeImei } from "../imei";

describe("normalizeImei", () => {
  it("strips spaces, dashes, and non-digit characters", () => {
    expect(normalizeImei("IMEI: 49-015420 3237518")).toBe("490154203237518");
  });
});

describe("isValidImeiLuhn", () => {
  it("accepts a known-valid IMEI", () => {
    expect(isValidImeiLuhn("490154203237518")).toBe(true);
  });

  it("rejects the same number with the last digit changed", () => {
    expect(isValidImeiLuhn("490154203237519")).toBe(false);
  });

  it("rejects anything that isn't exactly 15 digits", () => {
    expect(isValidImeiLuhn("12345")).toBe(false);
    expect(isValidImeiLuhn("4901542032375180")).toBe(false);
    expect(isValidImeiLuhn("49015420323751a")).toBe(false);
  });
});

describe("isValidImei", () => {
  it("normalizes then Luhn-validates in one call", () => {
    expect(isValidImei("49-0154203237518")).toBe(true);
  });

  it("rejects a malformed input even after normalization", () => {
    expect(isValidImei("not an imei")).toBe(false);
  });
});

describe("hashImei", () => {
  const ORIGINAL_SECRET = process.env.IMEI_HASH_SECRET;

  beforeEach(() => {
    process.env.IMEI_HASH_SECRET = "test-only-secret";
  });

  afterAll(() => {
    process.env.IMEI_HASH_SECRET = ORIGINAL_SECRET;
  });

  it("is deterministic for the same input and secret", () => {
    expect(hashImei("490154203237518")).toBe(hashImei("490154203237518"));
  });

  it("differs for different IMEIs", () => {
    expect(hashImei("490154203237518")).not.toBe(hashImei("112345678901236"));
  });

  it("throws if IMEI_HASH_SECRET is not configured", () => {
    delete process.env.IMEI_HASH_SECRET;
    expect(() => hashImei("490154203237518")).toThrow("IMEI_HASH_SECRET");
  });
});

describe("imeiHashesMatch", () => {
  it("returns true for identical hashes and false for different ones", () => {
    process.env.IMEI_HASH_SECRET = "test-only-secret";
    const a = hashImei("490154203237518");
    const b = hashImei("490154203237518");
    const c = hashImei("112345678901236");
    expect(imeiHashesMatch(a, b)).toBe(true);
    expect(imeiHashesMatch(a, c)).toBe(false);
  });
});
