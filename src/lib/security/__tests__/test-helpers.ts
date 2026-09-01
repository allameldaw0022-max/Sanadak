import yazl from "yazl";

export function buildZip(entries: { name: string; data: Buffer }[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const zipfile = new yazl.ZipFile();
    for (const entry of entries) {
      zipfile.addBuffer(entry.data, entry.name);
    }
    const chunks: Buffer[] = [];
    zipfile.outputStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    zipfile.outputStream.on("end", () => resolve(Buffer.concat(chunks)));
    zipfile.outputStream.on("error", reject);
    zipfile.end();
  });
}

// A minimal but spec-correct AXML buffer for
// `<manifest package="sd.example.app"><uses-permission android:name="android.permission.INTERNET"/></manifest>`
// built directly against the ResChunk/ResStringPool/ResXMLTree binary format
// (independent of src/lib/security/axml.ts), so parsing it is a real
// round-trip check rather than testing the parser against its own assumptions.
export function buildMinimalManifestAxml(): Buffer {
  const strings = ["manifest", "package", "sd.example.app", "uses-permission", "name", "android.permission.INTERNET"];

  const stringBufs = strings.map((s) => Buffer.from(s, "utf16le"));
  const stringCount = strings.length;

  let stringsDataLen = 0;
  const stringOffsets: number[] = [];
  for (const buf of stringBufs) {
    stringOffsets.push(stringsDataLen);
    stringsDataLen += 2 + buf.length + 2; // u16 length prefix + utf16 chars + null terminator
  }

  const poolHeaderLen = 8 + 4 * 5; // chunk header(8) + stringCount+styleCount+flags+stringsStart+stylesStart
  const offsetsLen = stringCount * 4;
  const stringsStart = poolHeaderLen + offsetsLen;
  const poolSize = stringsStart + stringsDataLen;

  const pool = Buffer.alloc(poolSize);
  pool.writeUInt16LE(0x0001, 0); // type STRING_POOL
  pool.writeUInt16LE(poolHeaderLen, 2); // headerSize
  pool.writeUInt32LE(poolSize, 4); // size
  pool.writeUInt32LE(stringCount, 8);
  pool.writeUInt32LE(0, 12); // styleCount
  pool.writeUInt32LE(0, 16); // flags (UTF-16, not sorted)
  pool.writeUInt32LE(stringsStart, 20);
  pool.writeUInt32LE(0, 24); // stylesStart
  stringOffsets.forEach((off, i) => pool.writeUInt32LE(off, poolHeaderLen + i * 4));

  let p = stringsStart;
  for (const buf of stringBufs) {
    pool.writeUInt16LE(buf.length / 2, p);
    p += 2;
    buf.copy(pool, p);
    p += buf.length;
    pool.writeUInt16LE(0, p);
    p += 2;
  }

  function startElement(nameIdx: number, attrs: { nameIdx: number; isString: boolean; valueIdx: number; raw: number }[]) {
    const attrSize = 20;
    const extHeaderSize = 8 + 8 + 20; // node header(8) + lineNumber+comment(8) + attrExt fixed fields(20)
    const size = extHeaderSize + attrs.length * attrSize;
    const buf = Buffer.alloc(size);
    buf.writeUInt16LE(0x0102, 0); // START_ELEMENT
    buf.writeUInt16LE(16, 2); // headerSize (node header ends after lineNumber+comment)
    buf.writeUInt32LE(size, 4);
    buf.writeInt32LE(0, 8); // lineNumber
    buf.writeInt32LE(-1, 12); // comment
    buf.writeInt32LE(-1, 16); // ns
    buf.writeInt32LE(nameIdx, 20);
    buf.writeUInt16LE(20, 24); // attributeStart
    buf.writeUInt16LE(attrSize, 26); // attributeSize
    buf.writeUInt16LE(attrs.length, 28); // attributeCount
    buf.writeUInt16LE(0, 30);
    buf.writeUInt16LE(0, 32);
    buf.writeUInt16LE(0, 34);
    let off = 36;
    for (const a of attrs) {
      buf.writeInt32LE(-1, off); // attr ns
      buf.writeInt32LE(a.nameIdx, off + 4);
      buf.writeInt32LE(a.isString ? a.valueIdx : -1, off + 8);
      buf.writeUInt16LE(8, off + 12); // Res_value.size
      buf.writeUInt8(0, off + 14); // res0
      buf.writeUInt8(a.isString ? 0x03 : 0x10, off + 15); // dataType
      buf.writeUInt32LE(a.isString ? a.valueIdx : a.raw, off + 16);
      off += attrSize;
    }
    return buf;
  }

  function endElement(nameIdx: number) {
    const buf = Buffer.alloc(24);
    buf.writeUInt16LE(0x0103, 0);
    buf.writeUInt16LE(16, 2);
    buf.writeUInt32LE(24, 4);
    buf.writeInt32LE(0, 8);
    buf.writeInt32LE(-1, 12);
    buf.writeInt32LE(-1, 16); // ns
    buf.writeInt32LE(nameIdx, 20);
    return buf;
  }

  const manifestStart = startElement(0, [{ nameIdx: 1, isString: true, valueIdx: 2, raw: 0 }]); // package="sd.example.app"
  const usesPermStart = startElement(3, [{ nameIdx: 4, isString: true, valueIdx: 5, raw: 0 }]); // android:name=...
  const usesPermEnd = endElement(3);
  const manifestEnd = endElement(0);

  const body = Buffer.concat([pool, manifestStart, usesPermStart, usesPermEnd, manifestEnd]);
  const total = 8 + body.length;
  const header = Buffer.alloc(8);
  header.writeUInt16LE(0x0003, 0); // RES_XML_TYPE
  header.writeUInt16LE(8, 2);
  header.writeUInt32LE(total, 4);

  return Buffer.concat([header, body]);
}
