import yauzl from "yauzl";

const MAX_ENTRIES = 20000;
const MAX_TOTAL_UNCOMPRESSED = 500 * 1024 * 1024; // 500MB guard against decompression bombs
const MAX_ENTRY_UNCOMPRESSED = 200 * 1024 * 1024;
const SUSPICIOUS_COMPRESSION_RATIO = 200;

export type ZipEntryInfo = {
  fileName: string;
  compressedSize: number;
  uncompressedSize: number;
  isDirectory: boolean;
};

export type SafeApkZip = {
  entries: ZipEntryInfo[];
  entryNames: Set<string>;
  readEntry: (fileName: string, maxBytes?: number) => Promise<Buffer | null>;
  suspiciousEntries: string[]; // path traversal / absolute paths / zip-slip attempts
  highCompressionRatio: boolean;
  close: () => void;
};

// Opens the APK strictly as a ZIP archive for static inspection only. We
// never write any entry to disk using its stored name (that's the classic
// zip-slip vector), and we bound total/per-entry decompressed size so a
// crafted archive can't exhaust server memory (a decompression bomb).
export function openApkZip(buffer: Buffer): Promise<SafeApkZip | { error: string }> {
  return new Promise((resolve) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true }, (err, zipfile) => {
      if (err || !zipfile) {
        resolve({ error: "ملف ZIP غير صالح أو تالف." });
        return;
      }

      const entries: ZipEntryInfo[] = [];
      const entryNames = new Set<string>();
      const suspiciousEntries: string[] = [];
      let totalUncompressed = 0;
      let highCompressionRatio = false;
      let settled = false;

      function fail(message: string) {
        if (settled) return;
        settled = true;
        zipfile.close();
        resolve({ error: message });
      }

      zipfile.on("error", () => fail("تعذر قراءة بنية ملف ZIP."));

      zipfile.on("entry", (entry: yauzl.Entry) => {
        if (settled) return;

        if (entries.length >= MAX_ENTRIES) {
          fail("عدد الملفات داخل الأرشيف يتجاوز الحد المسموح به.");
          return;
        }

        const isDirectory = /\/$/.test(entry.fileName);
        const uncompressedSize = entry.uncompressedSize;

        if (uncompressedSize > MAX_ENTRY_UNCOMPRESSED) {
          fail("أحد الملفات داخل الأرشيف يتجاوز الحجم المسموح به بعد فك الضغط.");
          return;
        }

        totalUncompressed += uncompressedSize;
        if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED) {
          fail("الحجم الإجمالي للملفات بعد فك الضغط يتجاوز الحد المسموح به (احتمال ضغط تفجيري).");
          return;
        }

        if (
          entry.compressedSize > 0 &&
          uncompressedSize / entry.compressedSize > SUSPICIOUS_COMPRESSION_RATIO
        ) {
          highCompressionRatio = true;
        }

        const name = entry.fileName;
        if (
          name.includes("..") ||
          name.startsWith("/") ||
          name.startsWith("\\") ||
          /^[a-zA-Z]:/.test(name) ||
          name.includes("\0")
        ) {
          suspiciousEntries.push(name);
        } else {
          entryNames.add(name);
        }

        entries.push({
          fileName: name,
          compressedSize: entry.compressedSize,
          uncompressedSize,
          isDirectory,
        });

        zipfile.readEntry();
      });

      zipfile.on("end", () => {
        if (settled) return;
        settled = true;
        resolve({
          entries,
          entryNames,
          suspiciousEntries,
          highCompressionRatio,
          close: () => zipfile.close(),
          readEntry: (fileName, maxBytes = MAX_ENTRY_UNCOMPRESSED) =>
            readSingleEntry(buffer, fileName, maxBytes),
        });
      });

      zipfile.readEntry();
    });
  });
}

// Re-opens the archive to stream a single named entry into memory, capped
// at maxBytes. Re-opening per entry keeps the API simple and is cheap at
// our 50MB APK size ceiling.
function readSingleEntry(buffer: Buffer, targetName: string, maxBytes: number): Promise<Buffer | null> {
  return new Promise((resolve) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        resolve(null);
        return;
      }
      let resolved = false;
      const done = (value: Buffer | null) => {
        if (resolved) return;
        resolved = true;
        zipfile.close();
        resolve(value);
      };

      zipfile.on("error", () => done(null));
      zipfile.on("end", () => done(null));

      zipfile.on("entry", (entry: yauzl.Entry) => {
        if (entry.fileName !== targetName || /\/$/.test(entry.fileName)) {
          zipfile.readEntry();
          return;
        }
        if (entry.uncompressedSize > maxBytes) {
          done(null);
          return;
        }
        zipfile.openReadStream(entry, (streamErr, stream) => {
          if (streamErr || !stream) {
            done(null);
            return;
          }
          const chunks: Buffer[] = [];
          let size = 0;
          stream.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > maxBytes) {
              done(null);
              stream.destroy();
              return;
            }
            chunks.push(chunk);
          });
          stream.on("end", () => done(Buffer.concat(chunks)));
          stream.on("error", () => done(null));
        });
      });

      zipfile.readEntry();
    });
  });
}
