import forge from "node-forge";
import type { SafeApkZip } from "./zip";

export type CertificateInfo = {
  isSigned: boolean;
  fingerprintSha256: string | null;
  subject: string | null;
  issuer: string | null;
  validFrom: string | null;
  validTo: string | null;
  signatureScheme: string; // "v1", "v1+v2", "v2-only", "unsigned"
};

const SIGNATURE_FILE = /^META-INF\/[^/]+\.(RSA|DSA|EC)$/i;

function certSubjectOrIssuer(attrs: forge.pki.CertificateField[]): string {
  return attrs.map((a) => `${a.shortName ?? a.name}=${a.value}`).join(", ");
}

// v1 (JAR) signing: META-INF/*.RSA|DSA|EC holds a PKCS#7 SignedData blob
// containing the signer's X.509 certificate.
function parseV1Certificate(pkcs7Der: Buffer): CertificateInfo | null {
  try {
    const asn1 = forge.asn1.fromDer(forge.util.createBuffer(pkcs7Der.toString("binary")));
    const p7 = forge.pkcs7.messageFromAsn1(asn1);
    const certs = "certificates" in p7 ? p7.certificates : [];
    if (!certs || certs.length === 0) return null;
    const cert = certs[0];

    const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const sha256 = forge.md.sha256.create().update(der).digest().toHex();

    return {
      isSigned: true,
      fingerprintSha256: sha256,
      subject: certSubjectOrIssuer(cert.subject.attributes),
      issuer: certSubjectOrIssuer(cert.issuer.attributes),
      validFrom: cert.validity.notBefore.toISOString(),
      validTo: cert.validity.notAfter.toISOString(),
      signatureScheme: "v1",
    };
  } catch {
    return null;
  }
}

// APK Signing Block v2/v3 sits immediately before the ZIP End Of Central
// Directory record and is identified by a fixed 16-byte magic. We only
// detect its presence here (full v2/v3 signer parsing is out of scope) —
// when v1 metadata is also present (the common case, kept for backward
// compatibility with old Android versions) we still get full certificate
// detail from it; when the APK is v2/v3-only we report the scheme without
// certificate detail rather than guessing.
function detectSigningBlockV2(fullApkBuffer: Buffer): boolean {
  const magic = Buffer.from("APK Sig Block 42", "ascii");
  const tail = fullApkBuffer.subarray(Math.max(0, fullApkBuffer.length - 200000));
  return tail.includes(magic);
}

export async function extractCertificateInfo(
  zip: SafeApkZip,
  fullApkBuffer: Buffer
): Promise<CertificateInfo> {
  const sigEntry = zip.entries.find((e) => SIGNATURE_FILE.test(e.fileName));
  const hasV2Block = detectSigningBlockV2(fullApkBuffer);

  if (!sigEntry) {
    return {
      isSigned: hasV2Block,
      fingerprintSha256: null,
      subject: null,
      issuer: null,
      validFrom: null,
      validTo: null,
      signatureScheme: hasV2Block ? "v2-only" : "unsigned",
    };
  }

  const data = await zip.readEntry(sigEntry.fileName);
  const parsed = data ? parseV1Certificate(data) : null;

  if (!parsed) {
    return {
      isSigned: hasV2Block,
      fingerprintSha256: null,
      subject: null,
      issuer: null,
      validFrom: null,
      validTo: null,
      signatureScheme: hasV2Block ? "v2-only (v1 file present but unparseable)" : "unsigned",
    };
  }

  return { ...parsed, signatureScheme: hasV2Block ? "v1+v2" : "v1" };
}
