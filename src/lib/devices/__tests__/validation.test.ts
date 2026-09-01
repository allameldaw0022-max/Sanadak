import { describe, expect, it } from "vitest";
import { validateDeviceRegistrationInput } from "../validation";

const VALID_IMEI1 = "490154203237518";
const VALID_IMEI2 = "356938035643809"; // a second, distinct known-valid Luhn IMEI

function base(overrides: Partial<Parameters<typeof validateDeviceRegistrationInput>[0]> = {}) {
  return {
    brand: "Samsung",
    model: "Galaxy A54",
    imei1: VALID_IMEI1,
    ...overrides,
  };
}

describe("validateDeviceRegistrationInput", () => {
  it("accepts a minimal valid registration (imei1 only)", () => {
    const result = validateDeviceRegistrationInput(base());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.imei1Normalized).toBe(VALID_IMEI1);
      expect(result.data.imei2Normalized).toBeNull();
      expect(result.data.color).toBeNull();
      expect(result.data.serialNumber).toBeNull();
    }
  });

  it("accepts a full registration with imei2, color, serial number", () => {
    const result = validateDeviceRegistrationInput(
      base({ color: "أسود", serialNumber: "SN-12345", imei2: VALID_IMEI2 })
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.imei2Normalized).toBe(VALID_IMEI2);
      expect(result.data.color).toBe("أسود");
      expect(result.data.serialNumber).toBe("SN-12345");
    }
  });

  it("rejects a missing brand", () => {
    const result = validateDeviceRegistrationInput(base({ brand: "  " }));
    expect(result.ok).toBe(false);
  });

  it("rejects a missing model", () => {
    const result = validateDeviceRegistrationInput(base({ model: "  " }));
    expect(result.ok).toBe(false);
  });

  describe("IMEI1 validity", () => {
    it("rejects a correctly-formatted but Luhn-invalid IMEI1", () => {
      const result = validateDeviceRegistrationInput(base({ imei1: "490154203237519" }));
      expect(result.ok).toBe(false);
    });

    it("rejects an IMEI1 with the wrong length", () => {
      const result = validateDeviceRegistrationInput(base({ imei1: "12345" }));
      expect(result.ok).toBe(false);
    });

    it("rejects an IMEI1 containing letters", () => {
      const result = validateDeviceRegistrationInput(base({ imei1: "49015420323751A" }));
      expect(result.ok).toBe(false);
    });

    it("accepts an IMEI1 containing spaces (normalized before validation)", () => {
      const result = validateDeviceRegistrationInput(base({ imei1: "49 0154 203237518" }));
      expect(result.ok).toBe(true);
    });

    it("accepts an IMEI1 containing dashes (normalized before validation)", () => {
      const result = validateDeviceRegistrationInput(base({ imei1: "49-0154-203237518" }));
      expect(result.ok).toBe(true);
    });
  });

  describe("IMEI2", () => {
    it("rejects imei2 === imei1", () => {
      const result = validateDeviceRegistrationInput(base({ imei2: VALID_IMEI1 }));
      expect(result.ok).toBe(false);
    });

    it("rejects imei2 === imei1 even when formatted differently (normalize-before-compare)", () => {
      const result = validateDeviceRegistrationInput(base({ imei2: "49-0154-203237518" }));
      expect(result.ok).toBe(false);
    });

    it("rejects an invalid imei2 even when imei1 is valid", () => {
      const result = validateDeviceRegistrationInput(base({ imei2: "not-an-imei" }));
      expect(result.ok).toBe(false);
    });

    it("treats an empty-string imei2 as absent, not invalid", () => {
      const result = validateDeviceRegistrationInput(base({ imei2: "" }));
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data.imei2Normalized).toBeNull();
    });
  });

  it("never echoes an owner_id, status, or device_id field on the validated data (none exist on the type)", () => {
    const result = validateDeviceRegistrationInput(base());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty("owner_id");
      expect(result.data).not.toHaveProperty("status");
      expect(result.data).not.toHaveProperty("device_id");
    }
  });
});
