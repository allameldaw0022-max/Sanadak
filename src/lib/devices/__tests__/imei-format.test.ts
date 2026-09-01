import { describe, expect, it } from "vitest";
import { isValidImei, isValidImeiLuhn, maskImei, normalizeImei } from "../imei-format";

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

describe("maskImei", () => {
  it("keeps only the last 3 digits visible for a 15-digit IMEI", () => {
    expect(maskImei("490154203237518")).toBe("************518");
  });

  it("never reveals more than the last 3 characters even for a short string", () => {
    expect(maskImei("12345")).toBe("**345");
  });

  it("returns the input unchanged when it's 3 characters or shorter", () => {
    expect(maskImei("123")).toBe("123");
    expect(maskImei("")).toBe("");
  });
});
