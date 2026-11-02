/**
 * Release/download contract for the site worker.
 *
 * These guard the two failure modes that shipped a "damaged" dmg to users:
 * a chunked download mixing bytes from two versions, and a whole-file response
 * being cached for a year behind a stable URL. Both are silent on the wire, so
 * they are pinned here instead.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import worker from '../src/index.js';

const VERSION = '1.14.2';
const ARM64_SIZE = 1000;
const X64_SIZE = 2000;
const SHA_ARM64 = 'a'.repeat(64);

const MANIFEST = {
  version: VERSION,
  released_at: '2026-11-02',
  files: {
    arm64: {
      key: 'miaomiao-bar/releases/arm64.dmg',
      name: 'miaomiao-bar-1.14.2-arm64.dmg',
      size: ARM64_SIZE,
      sha256: SHA_ARM64,
    },
    x64: {
      key: 'miaomiao-bar/releases/x64.dmg',
      name: 'miaomiao-bar-1.14.2-x64.dmg',
      size: X64_SIZE,
      sha256: 'b'.repeat(64),
    },
  },
};

const bytes = (size, seed) => new Uint8Array(size).map((_, index) => (index * 7 + seed) % 251);
const OBJECTS = {
  'miaomiao-bar/releases/arm64.dmg': bytes(ARM64_SIZE, 1),
  'miaomiao-bar/releases/x64.dmg': bytes(X64_SIZE, 3),
};
const ETAG = '"current-etag"';

/** Only what the handler actually touches: json(), ranged get(), head(). */
const R2 = {
  async get(key, options) {
    if (key.endsWith('latest.json')) return { json: async () => MANIFEST, body: null, size: 0 };

    const data = OBJECTS[key];
    if (!data) return null;

    const range = options?.range;
    const offset = range?.offset ?? 0;
    const length = range?.length ?? data.length;
    const slice = data.slice(offset, offset + length);
    return {
      body: new Blob([slice]).stream(),
      size: data.length,
      range: { offset, length },
      httpEtag: ETAG,
    };
  },
  async head(key) {
    const data = OBJECTS[key];
    return data ? { size: data.length, httpEtag: ETAG } : null;
  },
};

const env = { R2_RELEASES: R2, ASSETS: { fetch: async () => new Response('asset') } };
const get = (path, headers = {}) =>
  worker.fetch(new Request(`https://bar.example.com${path}`, { headers }), env);

test('manifest exposes sha256 and a versioned download url, uncached', async () => {
  const response = await get('/api/release?fresh=1');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');

  const body = await response.json();
  assert.equal(body.data.version, VERSION);
  assert.equal(body.data.files.arm64.sha256, SHA_ARM64);
  assert.equal(body.data.files.arm64.url, `/api/download?arch=arm64&v=${VERSION}`);
});

test('download without a version still works for older pages', async () => {
  const response = await get('/api/download?arch=arm64');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-length'), String(ARM64_SIZE));
  // A stale URL must not be cached for a year: that is how users kept getting
  // an old build after a release.
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('a stale version is refused instead of serving mismatched bytes', async () => {
  const response = await get('/api/download?arch=arm64&v=1.14.1');
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.error.code, 'conflict');
});

test('a ranged request returns exactly that slice', async () => {
  const response = await get(`/api/download?arch=arm64&v=${VERSION}`, { Range: 'bytes=0-99' });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('content-range'), `bytes 0-99/${ARM64_SIZE}`);
  assert.equal(response.headers.get('content-length'), '100');
});

test('a stale If-Range gets the whole file so a resume cannot splice versions', async () => {
  const response = await get(`/api/download?arch=arm64&v=${VERSION}`, {
    Range: 'bytes=500-',
    'If-Range': '"some-old-etag"',
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-length'), String(ARM64_SIZE));
  assert.equal(response.headers.get('content-range'), null);
});

test('a matching If-Range still gets a partial response', async () => {
  const response = await get(`/api/download?arch=arm64&v=${VERSION}`, {
    Range: 'bytes=500-',
    'If-Range': ETAG,
  });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('content-range'), `bytes 500-${ARM64_SIZE - 1}/${ARM64_SIZE}`);
});
