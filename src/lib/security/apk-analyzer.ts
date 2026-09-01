import { hashBuffer, type FileHashes } from "./hash";
import { openApkZip } from "./zip";
import { parseManifest, type ManifestInfo } from "./manifest";
import { extractCertificateInfo, type CertificateInfo } from "./certificate";

const ZIP_MAGIC_PREFIXES = ["PK\x03\x04", "PK\x05\x06", "PK\x07\x08"];
const MAX_URL_MATCHES = 200;
const URL_REGEX = /https?:\/\/[a-zA-Z0-9](?:[a-zA-Z0-9.-]{0,253})\.[a-zA-Z]{2,}(?:[/\w\-._~:?#[\]@!$&'()*+,;=%]*)?/g;

export type ApkAnalysisResult = {
  isValidApk: boolean;
  invalidReason: string | null;
  hashes: FileHashes;
  fileSize: number;
  manifest: ManifestInfo | null;
  certificate: CertificateInfo;
  nativeLibraries: string[];
  detectedUrls: string[];
  structuralFindings: string[];
};

function looksLikeZip(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  const head = buffer.subarray(0, 4).toString("latin1");
  return ZIP_MAGIC_PREFIXES.some((sig) => head.startsWith(sig));
}

function invalidResult(reason: string, buffer: Buffer): ApkAnalysisResult {
  return {
    isValidApk: false,
    invalidReason: reason,
    hashes: hashBuffer(buffer),
    fileSize: buffer.length,
    manifest: null,
    certificate: {
      isSigned: false,
      fingerprintSha256: null,
      subject: null,
      issuer: null,
      validFrom: null,
      validTo: null,
      signatureScheme: "unsigned",
    },
    nativeLibraries: [],
    detectedUrls: [],
    structuralFindings: [],
  };
}

function extractUrls(buffer: Buffer): string[] {
  const text = buffer.toString("latin1");
  const found = new Set<string>();
  for (const match of text.matchAll(URL_REGEX)) {
    if (found.size >= MAX_URL_MATCHES) break;
    found.add(match[0].slice(0, 300));
  }
  return Array.from(found);
}

// Runs entirely static, in-process inspection of the uploaded bytes — the
// APK is never executed or installed anywhere. Any unexpected structure
// (corrupt zip, unparseable manifest, oversized/decompression-bomb-shaped
// archive) degrades to a clearly-flagged invalid/unparseable result rather
// than throwing, so a hostile file can never crash the scan pipeline.
export async function analyzeApk(buffer: Buffer): Promise<ApkAnalysisResult> {
  if (buffer.length === 0) return invalidResult("الملف فارغ.", buffer);
  if (!looksLikeZip(buffer)) {
    return invalidResult("الملف ليس أرشيف ZIP/APK حقيقي (تم التحقق من محتوى الملف وليس فقط امتداده).", buffer);
  }

  const zip = await openApkZip(buffer);
  if ("error" in zip) return invalidResult(zip.error, buffer);

  if (!zip.entryNames.has("AndroidManifest.xml")) {
    return invalidResult("ملف APK غير مكتمل: لا يحتوي على AndroidManifest.xml.", buffer);
  }
  const hasDex = Array.from(zip.entryNames).some((n) => /^classes\d*\.dex$/.test(n));
  if (!hasDex) {
    return invalidResult("ملف APK غير مكتمل: لا يحتوي على classes.dex.", buffer);
  }

  const structuralFindings: string[] = [];
  if (zip.suspiciousEntries.length > 0) structuralFindings.push("zip_path_traversal_entries");
  if (zip.highCompressionRatio) structuralFindings.push("high_compression_ratio_entry");

  const hashes = hashBuffer(buffer);

  let manifest: ManifestInfo | null = null;
  try {
    const manifestBytes = await zip.readEntry("AndroidManifest.xml");
    manifest = manifestBytes ? parseManifest(manifestBytes) : null;
    if (!manifest) structuralFindings.push("manifest_unreadable");
  } catch {
    structuralFindings.push("manifest_unparseable");
  }

  const certificate = await extractCertificateInfo(zip, buffer);
  if (!certificate.isSigned) structuralFindings.push("apk_unsigned");

  const nativeLibraries = Array.from(
    new Set(
      zip.entries
        .filter((e) => !e.isDirectory && /^lib\/[^/]+\/[^/]+\.so$/.test(e.fileName))
        .map((e) => e.fileName.split("/").pop() as string)
    )
  );

  const detectedUrls: string[] = [];
  const dexEntries = zip.entries.filter((e) => /^classes\d*\.dex$/.test(e.fileName));
  for (const entry of dexEntries) {
    if (detectedUrls.length >= MAX_URL_MATCHES) break;
    const dexBuf = await zip.readEntry(entry.fileName);
    if (!dexBuf) continue;
    for (const url of extractUrls(dexBuf)) {
      if (detectedUrls.length >= MAX_URL_MATCHES) break;
      if (!detectedUrls.includes(url)) detectedUrls.push(url);
    }
  }

  zip.close();

  return {
    isValidApk: true,
    invalidReason: null,
    hashes,
    fileSize: buffer.length,
    manifest,
    certificate,
    nativeLibraries,
    detectedUrls,
    structuralFindings,
  };
}
