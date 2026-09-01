// Minimal, defensive parser for Android's compiled binary XML format (AXML),
// used only to statically read AndroidManifest.xml — no code from the APK
// is ever executed. Format reference: the well-documented ResChunk_header /
// ResStringPool_header / ResXMLTree_* structures used by AAPT.
//
// Every read is bounds-checked; any malformed structure aborts the parse
// (caught by the caller) rather than reading out of bounds.

const CHUNK_STRING_POOL = 0x0001;
const CHUNK_XML_START_NAMESPACE = 0x0100;
const CHUNK_XML_END_NAMESPACE = 0x0101;
const CHUNK_XML_START_ELEMENT = 0x0102;
const CHUNK_XML_END_ELEMENT = 0x0103;

const TYPE_STRING = 0x03;
const TYPE_INT_BOOLEAN = 0x12;

export type AxmlAttribute = { name: string; value: string; rawInt: number | null };
export type AxmlElement = {
  name: string;
  attributes: AxmlAttribute[];
  children: AxmlElement[];
};

class Reader {
  constructor(
    public buf: Buffer,
    public pos = 0
  ) {}
  remaining() {
    return this.buf.length - this.pos;
  }
  u16() {
    if (this.remaining() < 2) throw new Error("axml: unexpected EOF (u16)");
    const v = this.buf.readUInt16LE(this.pos);
    this.pos += 2;
    return v;
  }
  u32() {
    if (this.remaining() < 4) throw new Error("axml: unexpected EOF (u32)");
    const v = this.buf.readUInt32LE(this.pos);
    this.pos += 4;
    return v;
  }
  i32() {
    if (this.remaining() < 4) throw new Error("axml: unexpected EOF (i32)");
    const v = this.buf.readInt32LE(this.pos);
    this.pos += 4;
    return v;
  }
}

function parseStringPool(buf: Buffer, chunkStart: number, chunkSize: number): string[] {
  const r = new Reader(buf, chunkStart + 8); // skip type+headerSize+size already read by caller pattern
  const stringCount = r.u32();
  const styleCount = r.u32();
  const flags = r.u32();
  const stringsStart = r.u32();
  r.u32(); // stylesStart, unused

  const isUtf8 = (flags & 0x100) !== 0;
  const offsets: number[] = [];
  for (let i = 0; i < stringCount; i++) offsets.push(r.u32());
  for (let i = 0; i < styleCount; i++) r.u32();

  const dataStart = chunkStart + stringsStart;
  const chunkEnd = chunkStart + chunkSize;
  const result: string[] = [];

  for (const off of offsets) {
    const start = dataStart + off;
    if (start < 0 || start >= chunkEnd || start >= buf.length) {
      result.push("");
      continue;
    }
    try {
      if (isUtf8) {
        let p = start;
        // utf16 length (skipped), then utf8 length, each 1 or 2 bytes
        const readLen = () => {
          let len = buf[p] & 0x7f;
          if (buf[p] & 0x80) {
            p += 1;
            len = ((len & 0x7f) << 8) | buf[p];
          }
          p += 1;
          return len;
        };
        readLen(); // utf16 length, not needed
        const utf8Len = readLen();
        result.push(buf.subarray(p, p + utf8Len).toString("utf8"));
      } else {
        let p = start;
        let len = buf.readUInt16LE(p);
        p += 2;
        if (len & 0x8000) {
          const high = len & 0x7fff;
          const low = buf.readUInt16LE(p);
          p += 2;
          len = (high << 16) | low;
        }
        result.push(buf.toString("utf16le", p, p + len * 2));
      }
    } catch {
      result.push("");
    }
  }
  return result;
}

export function parseAndroidManifest(buf: Buffer): AxmlElement {
  if (buf.length < 8) throw new Error("axml: file too small");
  const root = new Reader(buf, 0);
  root.u16(); // type (RES_XML_TYPE)
  root.u16(); // headerSize
  root.u32(); // total size

  let strings: string[] = [];
  const stack: AxmlElement[] = [];
  const rootChildren: AxmlElement[] = [];

  let pos = root.pos;
  let iterations = 0;
  while (pos < buf.length - 8 && iterations < 200000) {
    iterations++;
    const chunkStart = pos;
    const type = buf.readUInt16LE(pos);
    const headerSize = buf.readUInt16LE(pos + 2);
    const size = buf.readUInt32LE(pos + 4);
    if (size < headerSize || size <= 0 || chunkStart + size > buf.length) {
      break;
    }

    if (type === CHUNK_STRING_POOL) {
      strings = parseStringPool(buf, chunkStart, size);
    } else if (type === CHUNK_XML_START_ELEMENT) {
      // ResXMLTree_attrExt begins right after the generic node header
      // (lineNumber(4) + comment(4)), i.e. at chunkStart + headerSize.
      const ext = new Reader(buf, chunkStart + headerSize);
      ext.i32(); // ns
      const nameIdx = ext.i32();
      ext.u16(); // attributeStart
      const attributeSize = ext.u16();
      const attributeCount = ext.u16();
      ext.u16(); // idIndex
      ext.u16(); // classIndex
      ext.u16(); // styleIndex

      const attrs: AxmlAttribute[] = [];
      let attrPos = ext.pos;
      for (let i = 0; i < attributeCount; i++) {
        if (attrPos + attributeSize > buf.length) break;
        const ar = new Reader(buf, attrPos);
        ar.i32(); // attr ns
        const attrNameIdx = ar.i32();
        const rawValueIdx = ar.i32();
        // Res_value follows at +12: size(2) res0(1) dataType(1) data(4)
        const valStart = attrPos + 12;
        const dataType = buf.readUInt8(valStart + 3);
        const data = buf.readUInt32LE(valStart + 4);

        const attrName = strings[attrNameIdx] ?? `attr_${attrNameIdx}`;
        let value = "";
        let rawInt: number | null = null;
        if (dataType === TYPE_STRING) {
          value = rawValueIdx >= 0 ? (strings[rawValueIdx] ?? "") : (strings[data] ?? "");
        } else if (dataType === TYPE_INT_BOOLEAN) {
          value = data !== 0 ? "true" : "false";
          rawInt = data;
        } else {
          rawInt = data;
          value = String(data);
        }
        attrs.push({ name: attrName, value, rawInt });
        attrPos += attributeSize;
      }

      const el: AxmlElement = {
        name: strings[nameIdx] ?? `el_${nameIdx}`,
        attributes: attrs,
        children: [],
      };
      if (stack.length > 0) stack[stack.length - 1].children.push(el);
      else rootChildren.push(el);
      stack.push(el);
    } else if (type === CHUNK_XML_END_ELEMENT) {
      if (stack.length > 0) stack.pop();
    } else if (type === CHUNK_XML_START_NAMESPACE || type === CHUNK_XML_END_NAMESPACE) {
      // not needed for our extraction
    }

    pos = chunkStart + size;
  }

  const manifest = rootChildren.find((e) => e.name === "manifest") ?? rootChildren[0];
  if (!manifest) throw new Error("axml: <manifest> root element not found");
  return manifest;
}

export function findChildren(el: AxmlElement, name: string): AxmlElement[] {
  return el.children.filter((c) => c.name === name);
}

export function attr(el: AxmlElement, name: string): string | undefined {
  return el.attributes.find((a) => a.name === name)?.value;
}
