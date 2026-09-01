import { describe, expect, it } from "vitest";
import forge from "node-forge";
import { extractCertificateInfo } from "../certificate";
import { openApkZip } from "../zip";
import { buildZip, buildMinimalManifestAxml } from "./test-helpers";

function buildV1SignedApkFixture() {
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date("2024-01-01T00:00:00Z");
  cert.validity.notAfter = new Date("2034-01-01T00:00:00Z");
  const attrs = [{ name: "commonName", value: "Sanadak Test Developer" }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer("dummy signed content");
  p7.addCertificate(cert);
  p7.addSigner({
    key: keys.privateKey,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
    ],
  });
  p7.sign();

  const der = Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), "binary");

  const expectedFingerprint = forge.md.sha256
    .create()
    .update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes())
    .digest()
    .toHex();

  return { certFileBuffer: der, expectedFingerprint };
}

describe("extractCertificateInfo", () => {
  it("extracts subject/issuer/fingerprint from a real v1 (JAR) PKCS#7 signature file", async () => {
    const { certFileBuffer, expectedFingerprint } = buildV1SignedApkFixture();

    const apkBuf = await buildZip([
      { name: "AndroidManifest.xml", data: buildMinimalManifestAxml() },
      { name: "classes.dex", data: Buffer.from("dex\n035\0x") },
      { name: "META-INF/CERT.RSA", data: certFileBuffer },
    ]);

    const zip = await openApkZip(apkBuf);
    if ("error" in zip) throw new Error(zip.error);

    const info = await extractCertificateInfo(zip, apkBuf);
    expect(info.isSigned).toBe(true);
    expect(info.fingerprintSha256).toBe(expectedFingerprint);
    expect(info.subject).toContain("Sanadak Test Developer");
    expect(info.signatureScheme).toBe("v1");
  });

  it("reports an unsigned APK honestly rather than guessing", async () => {
    const apkBuf = await buildZip([
      { name: "AndroidManifest.xml", data: buildMinimalManifestAxml() },
      { name: "classes.dex", data: Buffer.from("dex\n035\0x") },
    ]);
    const zip = await openApkZip(apkBuf);
    if ("error" in zip) throw new Error(zip.error);

    const info = await extractCertificateInfo(zip, apkBuf);
    expect(info.isSigned).toBe(false);
    expect(info.fingerprintSha256).toBeNull();
    expect(info.signatureScheme).toBe("unsigned");
  });
});
