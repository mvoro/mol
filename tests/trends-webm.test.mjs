import test from 'node:test';
import assert from 'node:assert/strict';
import { patchWebmDuration, withTrendVideoDuration } from '../src/trends-webm.js';
import { loadTrendImage, renderTrendVideo } from '../src/trends-engine.js';

const bytes = (...parts) => new Uint8Array(parts.flatMap(part => Array.from(part)));
const tag = (id, payload) => bytes(id, payload.length < 127 ? [0x80 | payload.length] : [0x40 | (payload.length >> 8), payload.length & 255], payload);
const INFO = [0x15, 0x49, 0xa9, 0x66], SEGMENT = [0x18, 0x53, 0x80, 0x67], CLUSTER = [0x1f, 0x43, 0xb6, 0x75];
const EBML = tag([0x1a, 0x45, 0xdf, 0xa3], tag([0x42, 0x82], new TextEncoder().encode('webm')));
const unknown = [1, 255, 255, 255, 255, 255, 255, 255];
const scale = value => tag([0x2a, 0xd7, 0xb1], [(value >> 16) & 255, (value >> 8) & 255, value & 255]);
const duration = value => { const float = new Uint8Array(8); new DataView(float.buffer).setFloat64(0, value); return tag([0x44, 0x89], float); };
const block = tag([0xa3], [0x81, 0, 0, 0x80, ...INFO, ...CLUSTER, 0xff, 0x17]);
const cluster = tag(CLUSTER, bytes(tag([0xe7], [0]), block));
const fixedSegment = content => bytes(EBML, tag(SEGMENT, content));
const unknownSegment = content => bytes(EBML, SEGMENT, unknown, content);

test('adds Duration in milliseconds to a MediaRecorder-style unknown-size segment', () => {
  const info = tag(INFO, scale(1_000_000));
  const original = unknownSegment(bytes(info, cluster));
  const expected = unknownSegment(bytes(tag(INFO, bytes(scale(1_000_000), duration(6000))), cluster));
  const repaired = patchWebmDuration(original, 6);
  assert.deepEqual(repaired, expected);
  assert.strictEqual(patchWebmDuration(repaired, 6), repaired, 'repair is idempotent');
});
test('preserves compressed blocks in unknown-size clusters, even when payload resembles metadata', () => {
  const openCluster = bytes(CLUSTER, [0xff], tag([0xe7], [0]), block);
  const original = unknownSegment(bytes(tag(INFO, scale(1_000_000)), openCluster, cluster));
  const expected = unknownSegment(bytes(tag(INFO, bytes(scale(1_000_000), duration(6000))), openCluster, cluster));
  assert.deepEqual(patchWebmDuration(original, 6), expected);
});
test('recalculates finite segment and Info lengths when metadata grows beyond one-byte size', () => {
  const application = tag([0x4d, 0x80], new Uint8Array(111).fill(65));
  const metadata = bytes(scale(1_000_000), application);
  const original = fixedSegment(bytes(tag(INFO, metadata), cluster));
  const expected = fixedSegment(bytes(tag(INFO, bytes(metadata, duration(6000))), cluster));
  assert.deepEqual(patchWebmDuration(original, 6), expected);
});
test('uses custom TimecodeScale, replaces non-finite Duration and removes stale optional indexes/checksums', () => {
  const checksum = tag([0xbf], [0, 0, 0, 0]);
  const seek = tag([0x11, 0x4d, 0x9b, 0x74], tag([0x4d, 0xbb], tag([0x53, 0xac], [20])));
  const cues = tag([0x1c, 0x53, 0xbb, 0x6b], []);
  const info = tag(INFO, bytes(checksum, scale(2_000_000), duration(Infinity)));
  const original = unknownSegment(bytes(checksum, seek, info, cluster, cues));
  const expected = unknownSegment(bytes(tag(INFO, bytes(scale(2_000_000), duration(3000))), cluster));
  assert.deepEqual(patchWebmDuration(original, 6), expected);
});
test('rejects damaged EBML and invalid requested durations instead of returning corrupt video', () => {
  assert.throws(() => patchWebmDuration(bytes(EBML, SEGMENT, [0x90], [1, 2]), 6), /Truncated/);
  assert.throws(() => patchWebmDuration(EBML, 6), /Missing WebM Segment/);
  for (const invalid of [0, -1, Infinity, NaN]) assert.throws(() => patchWebmDuration(EBML, invalid), /finite and positive/);
});
test('repairs existing persisted WebM blobs and leaves MP4 output unchanged', async () => {
  const original = unknownSegment(bytes(tag(INFO, scale(1_000_000)), cluster));
  const blob = new Blob([original], { type: 'video/webm;codecs=vp9' });
  const repaired = await withTrendVideoDuration(blob, 6);
  assert.equal(repaired.type, blob.type);
  assert.ok(repaired.size > blob.size);
  assert.strictEqual(await withTrendVideoDuration(repaired, 6), repaired);
  const mp4 = new Blob(['unchanged'], { type: 'video/mp4' });
  assert.strictEqual(await withTrendVideoDuration(mp4, 6), mp4);
});
test('cancelled image decoding cannot resolve successfully when its old load callback arrives', async () => {
  const previousImage = globalThis.Image;
  let pending;
  globalThis.Image = class { constructor() { pending = this; } };
  try {
    const controller = new AbortController();
    const loading = loadTrendImage('blob:test', controller.signal);
    const staleLoad = pending.onload;
    const rejected = assert.rejects(loading, error => error.name === 'AbortError');
    controller.abort();
    staleLoad();
    await rejected;
    assert.equal(pending.onload, null);
    assert.equal(pending.onerror, null);
    assert.equal(pending.src, '');
  } finally { if (previousImage === undefined) delete globalThis.Image; else globalThis.Image = previousImage; }
});
test('a cancelled generation exits before starting any recorder or image work', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(renderTrendVideo({ templateId: 'close-up', quality: '720', caption: '', character: { blob: new Blob(['photo']) } }, { signal: controller.signal }), error => error.name === 'AbortError');
});
