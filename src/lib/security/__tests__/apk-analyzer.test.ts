import { describe, expect, it } from "vitest";
import { analyzeApk } from "../apk-analyzer";
import { buildZip, buildMinimalManifestAxml } from "./test-helpers";

async function buildMinimalApk() {
  return buildZip([
    { name: "AndroidManifest.xml", data: buildMinimalManifestAxml() },
    { name: "classes.dex", data: Buffer.from("dex\n035\0fake-dex-body-for-tests") },
  ]);
}

describe("analyzeApk", () => {
  it("accepts a minimal well-formed APK-shaped zip and extracts its manifest", async () => {
    const buf = await buildMinimalApk();
    const result = await analyzeApk(buf);
    expect(result.isValidApk).toBe(true);
    expect(result.manifest?.packageName).toBe("sd.example.app");
    expect(result.hashes.sha256).toHaveLength(64);
    expect(result.certificate.isSigned).toBe(false); // no META-INF/*.RSA in this fixture
  });

  it("rejects a file that is not a ZIP/APK at all, regardless of its extension", async () => {
    const buf = Buffer.from("this is just plain text pretending to be an .apk file");
    const result = await analyzeApk(buf);
    expect(result.isValidApk).toBe(false);
    expect(result.invalidReason).toMatch(/ZIP\/APK/);
  });

  it("rejects an empty file", async () => {
    const result = await analyzeApk(Buffer.alloc(0));
    expect(result.isValidApk).toBe(false);
  });

  it("rejects a corrupted zip (valid magic, garbage body)", async () => {
    const buf = Buffer.concat([Buffer.from("PK\x03\x04"), Buffer.from("garbage-not-a-real-zip-structure-at-all")]);
    const result = await analyzeApk(buf);
    expect(result.isValidApk).toBe(false);
  });

  it("rejects a real zip that is missing AndroidManifest.xml", async () => {
    const buf = await buildZip([{ name: "classes.dex", data: Buffer.from("dex\n035\0x") }]);
    const result = await analyzeApk(buf);
    expect(result.isValidApk).toBe(false);
    expect(result.invalidReason).toMatch(/AndroidManifest/);
  });

  it("rejects a real zip that is missing classes.dex", async () => {
    const buf = await buildZip([{ name: "AndroidManifest.xml", data: buildMinimalManifestAxml() }]);
    const result = await analyzeApk(buf);
    expect(result.isValidApk).toBe(false);
    expect(result.invalidReason).toMatch(/classes\.dex/);
  });

  it("degrades gracefully (does not throw) when the manifest bytes are unparseable", async () => {
    const buf = await buildZip([
      { name: "AndroidManifest.xml", data: Buffer.from("not a real binary manifest") },
      { name: "classes.dex", data: Buffer.from("dex\n035\0x") },
    ]);
    const result = await analyzeApk(buf);
    expect(result.isValidApk).toBe(true);
    expect(result.manifest).toBeNull();
    expect(result.structuralFindings).toContain("manifest_unparseable");
  });

  it("collects native library file names under lib/<abi>/", async () => {
    const buf = await buildZip([
      { name: "AndroidManifest.xml", data: buildMinimalManifestAxml() },
      { name: "classes.dex", data: Buffer.from("dex\n035\0x") },
      { name: "lib/arm64-v8a/libnative.so", data: Buffer.from("fake-native-lib") },
    ]);
    const result = await analyzeApk(buf);
    expect(result.nativeLibraries).toContain("libnative.so");
  });

  it("detects URLs embedded in the dex bytes", async () => {
    const dexWithUrl = Buffer.concat([
      Buffer.from("dex\n035\0"),
      Buffer.from("some binary junk https://evil-c2-server.example.com/beacon more junk"),
    ]);
    const buf = await buildZip([
      { name: "AndroidManifest.xml", data: buildMinimalManifestAxml() },
      { name: "classes.dex", data: dexWithUrl },
    ]);
    const result = await analyzeApk(buf);
    expect(result.detectedUrls.some((u) => u.includes("evil-c2-server.example.com"))).toBe(true);
  });
});
