import { describe, expect, it } from 'vitest';

import { checksum, createZip } from '../src/application/export/zip.js';

const bytes = (text: string): Uint8Array => new TextEncoder().encode(text);

const readU32 = (data: Uint8Array, offset: number): number =>
  new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(offset, true);

const readU16 = (data: Uint8Array, offset: number): number =>
  new DataView(data.buffer, data.byteOffset, data.byteLength).getUint16(offset, true);

describe('checksum', () => {
  it('matches the known CRC-32 of "hello"', () => {
    expect(checksum(bytes('hello'))).toBe(0x3610a686);
  });

  it('is zero for no bytes', () => {
    expect(checksum(new Uint8Array())).toBe(0);
  });
});

describe('createZip', () => {
  const archive = createZip([
    { path: 'a.txt', data: bytes('hello') },
    { path: 'dir/b.txt', data: bytes('second entry') },
  ]);

  it('starts with a local file header', () => {
    expect(readU32(archive, 0)).toBe(0x04034b50);
  });

  it('stores entries uncompressed with their checksum', () => {
    expect(readU16(archive, 8)).toBe(0); // method: stored
    expect(readU32(archive, 14)).toBe(0x3610a686);
    expect(readU32(archive, 18)).toBe(5); // compressed size
    expect(readU32(archive, 22)).toBe(5); // uncompressed size
  });

  it('ends with an end-of-central-directory record naming both entries', () => {
    const end = archive.length - 22;
    expect(readU32(archive, end)).toBe(0x06054b50);
    expect(readU16(archive, end + 8)).toBe(2);
    expect(readU16(archive, end + 10)).toBe(2);
  });

  it('points the central directory at a real header', () => {
    const end = archive.length - 22;
    const size = readU32(archive, end + 12);
    const offset = readU32(archive, end + 16);
    expect(readU32(archive, offset)).toBe(0x02014b50);
    expect(offset + size).toBe(end);
  });

  it('is byte-identical for the same input', () => {
    const again = createZip([
      { path: 'a.txt', data: bytes('hello') },
      { path: 'dir/b.txt', data: bytes('second entry') },
    ]);
    expect(Array.from(again)).toEqual(Array.from(archive));
  });

  it('writes an empty archive that is still a valid container', () => {
    const empty = createZip([]);
    expect(empty.length).toBe(22);
    expect(readU32(empty, 0)).toBe(0x06054b50);
    expect(readU16(empty, 8)).toBe(0);
  });
});
