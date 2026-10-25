/**
 * A minimal ZIP writer.
 *
 * An Office package is a ZIP archive, and this is the whole of what writing one
 * requires: entries are stored uncompressed, so the only computed field is the
 * CRC. That keeps the archive dependency-free and the output deterministic —
 * the same document always produces the same bytes, which is what makes a
 * generated file diffable and testable.
 *
 * Deflate is deliberately not implemented. The payload is almost entirely PNG
 * data, which is already compressed; storing it costs a few percent of size and
 * removes a compressor from the trust surface.
 */

export interface ZipEntry {
  /** Path inside the archive, forward-slashed and without a leading slash. */
  readonly path: string;
  readonly data: Uint8Array;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

const crc32 = (data: Uint8Array): number => {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = (crc >>> 8) ^ (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

// 1980-01-01, the earliest timestamp the DOS format can express. A fixed date
// keeps the output byte-identical between runs.
const DOS_TIME = 0;
const DOS_DATE = 0x0021;

const LOCAL_HEADER_SIZE = 30;
const CENTRAL_HEADER_SIZE = 46;
const END_RECORD_SIZE = 22;

interface Prepared {
  readonly name: Uint8Array;
  readonly data: Uint8Array;
  readonly crc: number;
  readonly offset: number;
}

export const createZip = (entries: readonly ZipEntry[]): Uint8Array => {
  const encoder = new TextEncoder();
  const prepared: Prepared[] = [];

  let offset = 0;
  let centralSize = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.path);
    prepared.push({ name, data: entry.data, crc: crc32(entry.data), offset });
    offset += LOCAL_HEADER_SIZE + name.length + entry.data.length;
    centralSize += CENTRAL_HEADER_SIZE + name.length;
  }

  const centralOffset = offset;
  const output = new Uint8Array(centralOffset + centralSize + END_RECORD_SIZE);
  const view = new DataView(output.buffer);
  let cursor = 0;

  const u16 = (value: number): void => {
    view.setUint16(cursor, value, true);
    cursor += 2;
  };
  const u32 = (value: number): void => {
    view.setUint32(cursor, value >>> 0, true);
    cursor += 4;
  };
  const bytes = (value: Uint8Array): void => {
    output.set(value, cursor);
    cursor += value.length;
  };

  for (const entry of prepared) {
    u32(0x04034b50);
    u16(20); // version needed
    u16(0); // flags
    u16(0); // method: stored
    u16(DOS_TIME);
    u16(DOS_DATE);
    u32(entry.crc);
    u32(entry.data.length); // compressed
    u32(entry.data.length); // uncompressed
    u16(entry.name.length);
    u16(0); // extra length
    bytes(entry.name);
    bytes(entry.data);
  }

  for (const entry of prepared) {
    u32(0x02014b50);
    u16(20); // version made by
    u16(20); // version needed
    u16(0); // flags
    u16(0); // method
    u16(DOS_TIME);
    u16(DOS_DATE);
    u32(entry.crc);
    u32(entry.data.length);
    u32(entry.data.length);
    u16(entry.name.length);
    u16(0); // extra
    u16(0); // comment
    u16(0); // disk number
    u16(0); // internal attributes
    u32(0); // external attributes
    u32(entry.offset);
    bytes(entry.name);
  }

  u32(0x06054b50);
  u16(0); // this disk
  u16(0); // disk with central directory
  u16(prepared.length);
  u16(prepared.length);
  u32(centralSize);
  u32(centralOffset);
  u16(0); // comment length

  return output;
};

/** Exposed for the archive's own tests; not used elsewhere. */
export const checksum = crc32;
