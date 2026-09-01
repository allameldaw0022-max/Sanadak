import { createHash } from "node:crypto";

export type FileHashes = { sha256: string; sha1: string; md5: string };

export function hashBuffer(buffer: Buffer): FileHashes {
  return {
    sha256: createHash("sha256").update(buffer).digest("hex"),
    sha1: createHash("sha1").update(buffer).digest("hex"),
    md5: createHash("md5").update(buffer).digest("hex"),
  };
}
