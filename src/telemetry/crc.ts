/**
 * Optional wire integrity: NMEA-style checksum suffix on NDJSON lines.
 *
 *   {"v":1,"t_ms":123,...}*1A2B
 *
 * The four hex digits are CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) over
 * the UTF-8 bytes of the JSON text before the `*`. Lines without a suffix are
 * accepted unchanged — the checksum is additive, like everything else in the
 * V1 contract. Firmware that appends it gets corruption detection for free.
 */

export function crc16ccitt(data: string): number {
  const bytes = new TextEncoder().encode(data);
  let crc = 0xffff;
  for (const b of bytes) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
}

export function appendChecksum(line: string): string {
  return `${line}*${crc16ccitt(line).toString(16).toUpperCase().padStart(4, "0")}`;
}

export type CrcResult = "ok" | "bad" | "none";

const SUFFIX_RE = /^(.*)\*([0-9A-Fa-f]{4})$/;

/** Verify and strip a checksum suffix. `none` = line had no suffix. */
export function verifyAndStrip(line: string): { payload: string; crc: CrcResult } {
  const m = line.match(SUFFIX_RE);
  if (!m) return { payload: line, crc: "none" };
  return { payload: m[1], crc: crc16ccitt(m[1]) === parseInt(m[2], 16) ? "ok" : "bad" };
}
