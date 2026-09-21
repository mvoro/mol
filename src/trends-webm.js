// MediaRecorder WebM files omit Duration because recording initially has no end.
// Rebuild only the small Segment/Info headers; image/video block bytes stay intact.
const ID = {
  segment: 0x18538067, info: 0x1549a966, cluster: 0x1f43b675,
  duration: 0x4489, timecodeScale: 0x2ad7b1, crc: 0xbf,
  seekHead: 0x114d9b74, cues: 0x1c53bb6b,
};
const segmentChildren = new Set([
  ID.seekHead, ID.info, ID.cluster, 0x1654ae6b, ID.cues,
  0x1941a469, 0x1043a770, 0x1254c367,
]);
function vint(bytes, offset, isId = false) {
  const first = bytes[offset];
  if (!first) throw new Error('Invalid WebM variable integer');
  let width = 1, marker = 0x80;
  while (!(first & marker)) { width++; marker >>= 1; }
  if (width > (isId ? 4 : 8) || offset + width > bytes.length) throw new Error('Truncated WebM variable integer');
  let value = BigInt(isId ? first : first & (marker - 1));
  for (let index = 1; index < width; index++) value = (value << 8n) | BigInt(bytes[offset + index]);
  const unknown = !isId && value === (1n << BigInt(7 * width)) - 1n;
  if (!unknown && value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('WebM element is too large');
  return { width, value: unknown ? null : Number(value) };
}
function element(bytes, start, limit = bytes.length) {
  const id = vint(bytes, start, true);
  const size = vint(bytes, start + id.width);
  const body = start + id.width + size.width;
  const end = size.value === null ? limit : body + size.value;
  if (body > limit || end > limit) throw new Error('Truncated WebM element');
  return { id: id.value, start, body, end, unknown: size.value === null, idWidth: id.width };
}
function concat(parts) {
  const bytes = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  return bytes;
}
function sizeBytes(length) {
  const value = BigInt(length);
  let width = 1;
  while (value >= (1n << BigInt(7 * width)) - 1n) width++;
  const bytes = new Uint8Array(width);
  let remainder = value;
  for (let index = width - 1; index >= 0; index--) { bytes[index] = Number(remainder & 255n); remainder >>= 8n; }
  bytes[0] |= 1 << (8 - width);
  return bytes;
}
function unsigned(bytes) {
  let value = 0;
  for (const byte of bytes) value = value * 256 + byte;
  return value;
}
function childrenOfSegment(bytes, segment) {
  const children = [];
  for (let offset = segment.body; offset < segment.end;) {
    const child = element(bytes, offset, segment.end);
    if (child.unknown) {
      if (child.id !== ID.cluster) throw new Error('Unsupported unknown-sized WebM element');
      // Unknown-size clusters end at a sibling Segment child. Walk block headers,
      // never scan their compressed payload for byte patterns resembling IDs.
      let cursor = child.body;
      while (cursor < segment.end) {
        const next = element(bytes, cursor, segment.end);
        if (segmentChildren.has(next.id)) break;
        if (next.unknown) throw new Error('Unsupported unknown-sized WebM block');
        cursor = next.end;
      }
      child.end = cursor;
    }
    children.push(child);
    offset = child.end;
  }
  return children;
}
/** Add finite duration to one MediaRecorder WebM, preserving all encoded blocks. */
export function patchWebmDuration(bytes, durationSeconds) {
  if (!(durationSeconds > 0) || !Number.isFinite(durationSeconds)) throw new Error('Video duration must be finite and positive');
  let segment;
  for (let offset = 0; offset < bytes.length;) {
    const current = element(bytes, offset);
    if (current.id === ID.segment) { segment = current; break; }
    if (current.unknown) throw new Error('Invalid WebM root');
    offset = current.end;
  }
  if (!segment) throw new Error('Missing WebM Segment');
  const children = childrenOfSegment(bytes, segment);
  const info = children.find(child => child.id === ID.info);
  if (!info || info.unknown) throw new Error('Missing WebM Info');
  const metadata = [];
  let timecodeScale = 1_000_000;
  for (let offset = info.body; offset < info.end;) {
    const item = element(bytes, offset, info.end);
    if (item.unknown) throw new Error('Invalid WebM metadata');
    if (item.id === ID.timecodeScale) timecodeScale = unsigned(bytes.subarray(item.body, item.end));
    metadata.push(item);
    offset = item.end;
  }
  if (!(timecodeScale > 0)) throw new Error('Invalid WebM timecode scale');
  const durationValue = durationSeconds * 1_000_000_000 / timecodeScale;
  const oldDuration = metadata.find(item => item.id === ID.duration);
  if (oldDuration && [4, 8].includes(oldDuration.end - oldDuration.body)) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + oldDuration.body, oldDuration.end - oldDuration.body);
    const oldValue = view.byteLength === 4 ? view.getFloat32(0) : view.getFloat64(0);
    if (Number.isFinite(oldValue) && Math.abs(oldValue - durationValue) < .001) return bytes;
  }
  const duration = new Uint8Array(11);
  duration.set([0x44, 0x89, 0x88]);
  new DataView(duration.buffer).setFloat64(3, durationValue);
  const infoBody = concat([
    ...metadata.filter(item => item.id !== ID.duration && item.id !== ID.crc).map(item => bytes.subarray(item.start, item.end)),
    duration,
  ]);
  const nextInfo = concat([bytes.subarray(info.start, info.start + info.idWidth), sizeBytes(infoBody.length), infoBody]);
  // These optional indexes contain byte offsets invalidated by a growing Info.
  // Short recorder clips remain seekable without them; remove instead of leaving
  // stale pointers. Remove the optional Segment checksum for the same reason.
  const body = concat(children.filter(child => ![ID.seekHead, ID.cues, ID.crc].includes(child.id)).map(child => child === info ? nextInfo : bytes.subarray(child.start, child.end)));
  const header = segment.unknown ? bytes.subarray(segment.start, segment.body) : concat([bytes.subarray(segment.start, segment.start + segment.idWidth), sizeBytes(body.length)]);
  return concat([bytes.subarray(0, segment.start), header, body, bytes.subarray(segment.end)]);
}
export async function withTrendVideoDuration(blob, durationSeconds) {
  if (!blob.type.includes('webm')) return blob;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const next = patchWebmDuration(bytes, durationSeconds);
  return next === bytes ? blob : new Blob([next], { type: blob.type });
}
