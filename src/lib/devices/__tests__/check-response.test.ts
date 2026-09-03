import { describe, expect, it } from "vitest";
import { buildImeiCheckDisclosure } from "../check-response";

describe("buildImeiCheckDisclosure", () => {
  it("discloses ACTIVE with its message and owner name", () => {
    const result = buildImeiCheckDisclosure("ACTIVE", "أحمد م.");
    expect(result).toEqual({
      disclosed: true,
      status: "ACTIVE",
      message: expect.any(String),
      ownerDisplayName: "أحمد م.",
    });
  });

  it("discloses UNDER_REVIEW, LOST, STOLEN, RECOVERED each with a message", () => {
    for (const status of ["UNDER_REVIEW", "LOST", "STOLEN", "RECOVERED"] as const) {
      const result = buildImeiCheckDisclosure(status, "أحمد م.");
      expect(result.disclosed).toBe(true);
      if (result.disclosed) {
        expect(result.status).toBe(status);
        expect(result.message.length).toBeGreaterThan(0);
      }
    }
  });

  it("never discloses BLOCKED", () => {
    const result = buildImeiCheckDisclosure("BLOCKED", "أحمد م.");
    expect(result.disclosed).toBe(false);
  });

  it("produces the exact same response for BLOCKED and for 'not found' (null), regardless of what owner name the DB layer sends", () => {
    const blocked = buildImeiCheckDisclosure("BLOCKED", "أحمد م.");
    const notFound = buildImeiCheckDisclosure(null, null);
    expect(blocked).toEqual(notFound);
  });

  it("never puts owner/device identifiers anywhere in the response shape", () => {
    for (const status of ["ACTIVE", "UNDER_REVIEW", "LOST", "STOLEN", "RECOVERED", "BLOCKED", null] as const) {
      const result = buildImeiCheckDisclosure(status, "أحمد م.");
      const keys = Object.keys(result);
      expect(keys).not.toContain("owner_id");
      expect(keys).not.toContain("device_id");
      expect(keys).not.toContain("email");
      expect(keys).not.toContain("phone");
      expect(keys).not.toContain("evidence");
    }
  });

  it("only ever surfaces ownerDisplayName for ACTIVE, UNDER_REVIEW, RECOVERED -- never LOST or STOLEN, even if the DB layer sent one", () => {
    for (const status of ["LOST", "STOLEN"] as const) {
      const result = buildImeiCheckDisclosure(status, "أحمد م.");
      expect(result.disclosed).toBe(true);
      if (result.disclosed) {
        expect(result.ownerDisplayName).toBeNull();
      }
    }
    for (const status of ["ACTIVE", "UNDER_REVIEW", "RECOVERED"] as const) {
      const result = buildImeiCheckDisclosure(status, "أحمد م.");
      expect(result.disclosed).toBe(true);
      if (result.disclosed) {
        expect(result.ownerDisplayName).toBe("أحمد م.");
      }
    }
  });

  it("passes through a null owner name (no valid profile, or single-word name) without failing", () => {
    const result = buildImeiCheckDisclosure("ACTIVE", null);
    expect(result.disclosed).toBe(true);
    if (result.disclosed) {
      expect(result.ownerDisplayName).toBeNull();
    }
  });
});
