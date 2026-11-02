/**
 * miaomiao-bar — official site worker.
 *
 * Only /api/* reaches this script (see run_worker_first in wrangler.jsonc); every
 * other request is served straight from the static asset layer, which keeps the
 * site free and fast.
 *
 * Privacy: no IP addresses, no user agents, no cookies, no third parties. The one
 * piece of state is the anonymous launch signal described in the stats section
 * below — a random device id, the UTC date and coarse geo from Cloudflare.
 */

// The bucket (`common`) is shared with the other projects, so every key carries
// this project's prefix: common → miaomiao-bar/releases/latest.json.
const KEY_PREFIX = 'miaomiao-bar/';
const MANIFEST_KEY = `${KEY_PREFIX}releases/latest.json`;
const CACHE_TTL_MS = 60_000;
const ALLOWED_ARCH = new Set(['arm64', 'x64']);

let manifestCache = { value: null, at: 0 };

function json(status, payload, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

function fail(status, code, message) {
  return json(status, { ok: false, error: { code, message } });
}

async function readManifest(env, { fresh = false } = {}) {
  const now = Date.now();
  if (!fresh && manifestCache.value && now - manifestCache.at < CACHE_TTL_MS) {
    return manifestCache.value;
  }

  const object = await env.R2_RELEASES.get(MANIFEST_KEY);
  if (!object) return null;

  let parsed;
  try {
    parsed = await object.json();
  } catch {
    return null;
  }

  manifestCache = { value: parsed, at: now };
  return parsed;
}

/** Public shape: never expose the internal R2 key. */
function publicManifest(manifest) {
  const files = {};
  for (const arch of ['arm64', 'x64']) {
    const file = manifest?.files?.[arch];
    if (!file) continue;
    files[arch] = {
      name: file.name,
      size: file.size ?? null,
      // 清单里本来就写好了 sha256，前端拿它做最后一道校验就不再靠运气。
      sha256: file.sha256 ?? null,
      // 版本号进 URL：发版后旧链接指向的字节不会被拼到新文件里。
      url: `/api/download?arch=${arch}&v=${encodeURIComponent(manifest.version)}`,
    };
  }

  return {
    version: manifest?.version ?? null,
    released_at: manifest?.released_at ?? null,
    files,
  };
}

async function handleRelease(env, url) {
  const manifest = await readManifest(env, { fresh: url?.searchParams.get('fresh') === '1' });
  if (!manifest) {
    return fail(503, 'release_unavailable', '安装包还没上传，稍后再来');
  }

  // 版本号是强一致信息：缓存 60 秒会让页面拿着旧 size 去切新文件。
  return json(200, { ok: true, data: publicManifest(manifest) });
}

function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header ?? '');
  if (!match) return null;

  const start = match[1] === '' ? size - Number(match[2]) : Number(match[1]);
  const end = match[1] === '' || match[2] === '' ? size - 1 : Number(match[2]);

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end >= size || start > end) {
    return null;
  }

  return { offset: start, length: end - start + 1, start, end };
}

async function handleDownload(request, env) {
  const url = new URL(request.url);
  const arch = url.searchParams.get('arch') ?? 'arm64';
  if (!ALLOWED_ARCH.has(arch)) return fail(400, 'bad_arch', '未知架构');

  let manifest = await readManifest(env);

  // 客户端带着版本号来下载时，必须和这一版的对象严格对应。否则会拿旧 size
  // 去切新文件——拼出来的 dmg 少一截，用户只看到「文件已损坏」。
  const wantedVersion = url.searchParams.get('v');
  if (wantedVersion && manifest?.version !== wantedVersion) {
    manifest = await readManifest(env, { fresh: true });
    if (manifest?.version !== wantedVersion) {
      return fail(
        409,
        'conflict',
        `安装包已更新到 ${manifest?.version ?? '新版本'}，请刷新页面后重新下载`,
      );
    }
  }

  const file = manifest?.files?.[arch];
  if (!file?.key) return fail(404, 'not_found', '这个架构的安装包还没上传');

  const size = file.size ?? 0;
  let range = size ? parseRange(request.headers.get('range'), size) : null;

  // If-Range：浏览器续传时会带上它。对象已经换成新版本时必须回整包，让客户端
  // 从头下，而不是把新版本的尾巴接到旧版本的前半截上。
  const ifRange = request.headers.get('if-range');
  if (range && ifRange) {
    const head = await env.R2_RELEASES.head(file.key);
    if (!head?.httpEtag || ifRange.trim() !== head.httpEtag) range = null;
  }

  const object = await env.R2_RELEASES.get(file.key, range ? { range } : undefined);
  if (!object) return fail(404, 'not_found', '安装包丢失了');

  const headers = new Headers();
  headers.set('content-type', 'application/octet-stream');
  headers.set('accept-ranges', 'bytes');
  // 安装包一律不进任何中间缓存。整包响应曾经被标成 `immutable` 一年，而下载 URL
  // 又不带版本号 —— 发版后同一个 URL 会继续返回旧包，等于让老用户永远下到旧版。
  headers.set('cache-control', 'no-store');

  if (range) {
    headers.set('content-range', `bytes ${range.start}-${range.end}/${size}`);
    headers.set('content-length', String(range.length));
  } else {
    if (size) headers.set('content-length', String(size));
    headers.set('content-disposition', `attachment; filename="${file.name ?? `miaomiao-bar-${arch}.dmg`}"`);
  }

  return new Response(object.body, { status: range ? 206 : 200, headers });
}


/* ---------------------------------------------------------------- stats */

const DEVICE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** UTC date, so one launch always lands on exactly one day. */
function utcDate() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Record one app launch.
 *
 * Only what the client generated locally (a random UUID) plus the coarse geo
 * Cloudflare derives for the request. No IP, no user agent, no hardware.
 */
async function handlePing(request, env) {
  if (request.method !== 'POST') return fail(405, 'method_not_allowed', '只支持 POST');

  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'bad_request', '请求体不是合法 JSON');
  }

  const device = String(body?.device || '');
  if (!DEVICE_ID_RE.test(device)) return fail(400, 'bad_request', 'device 必须是 UUID');

  const cf = request.cf || {};

  try {
    await env.DB.prepare(
      `INSERT INTO bar_launches (device_id, date, country, region, city, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(device, utcDate(), cf.country || null, cf.region || null, cf.city || null, Date.now())
      .run();
  } catch (error) {
    console.error('[ping] insert failed', error);
    return fail(500, 'internal_error', '记录失败');
  }

  return json(200, { ok: true });
}

/** Aggregates only: the public endpoint never exposes device ids. */
async function handleStats(env) {
  const today = utcDate();
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

  try {
    const [total, todayRow, weekRow, cities, countries, daily] = await Promise.all([
      env.DB.prepare('SELECT COUNT(DISTINCT device_id) AS n FROM bar_launches').first(),
      env.DB.prepare('SELECT COUNT(DISTINCT device_id) AS n FROM bar_launches WHERE date = ?').bind(today).first(),
      env.DB.prepare('SELECT COUNT(DISTINCT device_id) AS n FROM bar_launches WHERE date >= ?').bind(weekAgo).first(),
      env.DB.prepare(
        `SELECT city, country, COUNT(DISTINCT device_id) AS devices
         FROM bar_launches WHERE city IS NOT NULL AND city != ''
         GROUP BY city, country ORDER BY devices DESC, city ASC LIMIT 40`,
      ).all(),
      env.DB.prepare(
        `SELECT country, COUNT(DISTINCT device_id) AS devices
         FROM bar_launches WHERE country IS NOT NULL AND country != ''
         GROUP BY country ORDER BY devices DESC`,
      ).all(),
      env.DB.prepare(
        `SELECT date, COUNT(DISTINCT device_id) AS uv FROM bar_launches
         GROUP BY date ORDER BY date DESC LIMIT 30`,
      ).all(),
    ]);

    return json(
      200,
      {
        ok: true,
        data: {
          totalDevices: total?.n ?? 0,
          todayDevices: todayRow?.n ?? 0,
          weekDevices: weekRow?.n ?? 0,
          cities: (cities?.results || []).map((row) => ({ city: row.city, country: row.country, devices: row.devices })),
          countries: (countries?.results || []).map((row) => ({ code: row.country, devices: row.devices })),
          daily: (daily?.results || []).map((row) => ({ date: row.date, uv: row.uv })),
        },
      },
      { 'Cache-Control': 'public, max-age=120' },
    );
  } catch (error) {
    console.error('[stats] query failed', error);
    return fail(500, 'internal_error', '统计查询失败');
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/release') return handleRelease(env, url);
    if (url.pathname === '/api/download') return handleDownload(request, env);
    if (url.pathname === '/api/ping') return handlePing(request, env);
    if (url.pathname === '/api/stats') return handleStats(env);

    return new Response('Not found', { status: 404 });
  },
};
