/**
 * Site behaviour: bilingual copy, the release manifest, and a chunked dmg
 * download with a progress bar (single connections are throttled often enough
 * that parallel ranges are worth the extra code).
 */

const dict = {
  zh: {
    brand: '喵喵剪贴板',
    'nav.actions': '动作',
    'nav.details': '细节',
    'nav.bucket': '图床',
    'nav.faq': '常见问题',
    'nav.stats': '统计',
    'hero.title': '喵喵剪贴板',
    'hero.tagline': '文字和图片进了剪贴板，就变成你要的样子',
    'hero.desc': '给文字工作者用的：复制一段文字或一张图——清理干净、排好版、富文本与 Markdown 互转；图片能传进你自己的图床拿回链接，也能交给「预览」慢慢改。一条龙，都在菜单栏里。',
    'hero.meta': 'macOS 13+ · 最新版本 v{v} · 首次打开需在「隐私与安全性」放行一次',
    'download.arm': '下载 Apple Silicon 版',
    'download.intel': 'Intel 版',
    'download.wait': '正在准备下载…',
    'download.done': '已开始下载',
    'download.toast': '下载完成：{name} 已存入「下载」文件夹',
    'download.cancel': '取消',
    'download.canceled': '已取消下载，临时数据已清理',

    'gk.title': '首次打开需要允许一次',
    'gk.intro':
      '下载完成。应用不是从 App Store 安装的，macOS 第一次会拦下它——这是正常现象，放行一次即可。',
    'gk.step1':
      '把「喵喵剪贴板.app」拖进「应用程序」，双击打开；看到「未打开」的提示时点「完成」。',
    'gk.step2':
      '打开「系统设置 → 隐私与安全性」，在「安全性」区域找到被阻止的应用，点「仍要打开」。',
    'gk.step3': '输入 Mac 密码或使用触控 ID，之后就能正常双击打开。',
    'gk.note': '如果系统提示「已损坏」，在「终端」里执行一次：',
    'gk.copy': '复制',
    'gk.copied': '已复制',
    'gk.ok': '我知道了',
    'download.failed': '下载失败，请到 GitHub 反馈',
    'download.fallback': '多线程下载失败，已改用直链下载',
    'download.unavailable': '安装包还在上传，稍后再来',
    'shots.main': '剪贴板里是什么，就列出能变成什么',
    'shots.history': '最近复制过的东西，点一下就回去',
    'shots.settings': '历史、图床、开机启动，都在设置里',
    'shots.darkLabel': '深色模式 · 深夜里的喵喵剪贴板',
    'details.title': '三个顺手的小细节',
    'details.themeTitle': '默认白天模式',
    'details.theme1': '奶油纸 + 焦糖墨，点开像张便签',
    'details.theme2': '右上角的小太阳可以换成深夜的炭黑',
    'details.theme3': '手动切换、记住选择，不跟随系统',
    'details.imageTitle': '图片三件事',
    'details.image1': '复制到剪贴板，随时贴进别的应用',
    'details.image2': '预览打开图片，用系统「预览」随手改',
    'details.image3': '存到下载目录，或上传到自己的图床',
    'details.editTitle': '改完直接覆盖剪贴板',
    'details.edit1': '文字点「编辑」改字；图片能裁剪、打码、画笔、箭头',
    'details.edit2': '保存即覆盖剪贴板，⌘↵ 快速保存',
    'details.edit3': '⌥⌘Z 可以撤销这次覆盖',
    'actions.title': '21 个动作，六个分组',
    'actions.lead':
      '面板不会把所有功能都摊在你脸上：剪贴板是图片就只出图片动作，是普通文字就不会出现「转纯文本」。',
    'group.convert': '转换',
    'group.clean': '清理',
    'group.typography': '排版',
    'group.list': '列表',
    'group.link': '链接',
    'group.image': '图片',
    'item.plain': '转纯文本（剥掉格式，只剩字）',
    'item.toMarkdown': '转 Markdown（带格式的文字 → 干净源码）',
    'item.toRich': '转富文本（Markdown → 带格式，粘进 Word/微信）',
    'item.trim': '去首尾空白 · 合并空行',
    'item.numbers': '去掉行号 · 压成一行',
    'item.invisible': '清除隐形字符（零宽、BOM）',
    'item.markdown': '去掉 Markdown 标记',
    'item.spacing': '中英文之间自动加空格',
    'item.fullwidth': '标点转全角',
    'item.dedupe': '去重行 · 排序行',
    'item.tracking': '净化链接（去掉 utm_* 跟踪参数）',
    'item.extract': '提取文中所有链接',
    'item.upload': '上传到图床 → 链接',
    'item.save': '复制到剪贴板 · 存到下载目录',
    'bucket.title': '图片存在你自己的桶里',
    'bucket.lead':
      '没有官方图床，也没有账号。填一个 S3 兼容存储，链接就指向你自己的域名，费用和隐私都归你。',
    'bucket.col.field': '字段',
    'bucket.col.value': '填什么',
    'bucket.region': 'R2 填 auto，COS/OSS 填真实地域',
    'bucket.name': '桶名',
    'bucket.nameValue': '你的存储桶名称',
    'bucket.public': '公开域名',
    'bucket.publicValue': '图片对外服务的域名，回给你的链接就用它',
    'bucket.keys': '有写权限的 S3 密钥；Secret 用 macOS 钥匙串加密',
    'bucket.note': 'R2 最省：10 GB 免费、不收流出流量费。对象名按内容寻址，同一张图传两次只有一个文件。',
    'faq.title': '常见问题',
    'faq.q1': '双击提示「未验证的开发者」怎么办？',
    'faq.a1':
      '安装包是 ad-hoc 签名、没做 Apple 公证。点「完成」关闭提示后，到「系统设置 → 隐私与安全性」点「仍要打开」（macOS 14 及更早可右键图标 → 打开）。',
    'faq.q2': '它是怎么记录剪贴板历史的？',
    'faq.a2':
      'macOS 没有剪贴板变更事件，只能轮询：文字每 1.2 秒读一次并比对哈希，图片每 3 秒采样一次、且只在剪贴板没有文字时才读。副作用是连拍两张图时，第二张可能不会被记录。',
    'faq.q3': '数据存在哪？会上传吗？',
    'faq.a3':
      '历史存在本机 ~/Library/Application Support/喵喵剪贴板/，图片是一个索引加若干文件。网络请求只有两类：图片 PUT 到你配置的存储桶，以及每次启动一条匿名信号（随机设备 ID + 城市级定位，可在设置关闭）。',
    'faq.q4': '需要什么系统权限？',
    'faq.a4':
      '完全不需要系统权限：⌥⌘V 呼出面板，文字与图片处理都直接可用。截图交给 macOS 自带的 ⌘⇧⌃4（直接进剪贴板），喵喵剪贴板只负责把它变成你要的样子。',
    'footer.license': 'AGPL-3.0-only + 商业授权',
    'footer.issue': '反馈',
  },
  en: {
    brand: 'Miaomiao Bar',
    'nav.actions': 'Actions',
    'nav.details': 'Details',
    'nav.bucket': 'Image host',
    'nav.faq': 'FAQ',
    'nav.stats': 'Stats',
    'hero.title': 'Miaomiao Bar',
    'hero.tagline': 'A screenshot or a snippet of text lands on the clipboard, and leaves in the shape you need',
    'hero.desc': 'For people who write: copy some text or a picture — it comes back cleaned, spaced and converted between rich text and Markdown; images go to your own bucket as links, or open in Preview for a slower pass.',
    'hero.meta': 'macOS 13+ · latest v{v} · allow it once in Privacy & Security on first launch',
    'download.arm': 'Download for Apple Silicon',
    'download.intel': 'Intel build',
    'download.wait': 'Preparing the download…',
    'download.done': 'Download started',
    'download.toast': 'Download complete — {name} is in your Downloads folder',
    'download.cancel': 'Cancel',
    'download.canceled': 'Download canceled — temporary data cleared',

    'gk.title': 'Allow it once on first launch',
    'gk.intro':
      'Download complete. The app is not distributed through the App Store, so macOS blocks it once — that is expected. Allow it and it opens normally from then on.',
    'gk.step1':
      'Drag “喵喵剪贴板.app” into Applications and double-click it. When macOS says it cannot verify the app, choose “Done”.',
    'gk.step2':
      'Open System Settings → Privacy & Security. In the Security section, find the blocked app and choose “Open Anyway”.',
    'gk.step3': 'Enter your Mac password or use Touch ID. The app opens normally afterwards.',
    'gk.note': 'If macOS reports the app is damaged, run this once in Terminal:',
    'gk.copy': 'Copy',
    'gk.copied': 'Copied',
    'gk.ok': 'Got it',
    'download.failed': 'Download failed — please open an issue on GitHub',
    'download.fallback': 'Chunked download failed — switched to the direct link',
    'download.unavailable': 'The build is still uploading, check back soon',
    'shots.main': 'What is on the clipboard decides what the panel offers',
    'shots.history': 'Everything you copied recently, one click away',
    'shots.settings': 'History, bucket and launch-at-login live in settings',
    'shots.darkLabel': 'Dark mode — the bar after closing',
    'details.title': 'Three small things you will notice',
    'details.themeTitle': 'Open in daylight by default',
    'details.theme1': 'Cream paper and caramel ink, like a sticky note',
    'details.theme2': 'The sun button up top switches to the after-hours charcoal',
    'details.theme3': 'Switched by hand and remembered, never follows macOS',
    'details.imageTitle': 'Three things for images',
    'details.image1': 'Copy to clipboard, paste anywhere',
    'details.image2': 'Open in Preview and edit it there',
    'details.image3': 'Save to Downloads, or upload to your own bucket',
    'details.editTitle': 'Overwrite the clipboard in place',
    'details.edit1': 'Edit text; crop, mosaic, draw or arrow on an image',
    'details.edit2': 'Saving overwrites the clipboard; ⌘↵ saves fast',
    'details.edit3': '⌥⌘Z undoes that overwrite',
    'actions.title': '21 actions, six groups',
    'actions.lead':
      'The panel never dumps everything on you: an image only shows image actions, plain prose never offers "To plain text".',
    'group.convert': 'Convert',
    'group.clean': 'Clean up',
    'group.typography': 'Typography',
    'group.list': 'Lists',
    'group.link': 'Links',
    'group.image': 'Image',
    'item.plain': 'To plain text (strip the formatting, keep the words)',
    'item.toMarkdown': 'To Markdown (formatted text → clean source)',
    'item.toRich': 'To rich text (Markdown → formatted for Word/WeChat)',
    'item.trim': 'Trim · collapse blank lines',
    'item.numbers': 'Strip line numbers · join into one line',
    'item.invisible': 'Remove invisible characters (zero-width, BOM)',
    'item.markdown': 'Strip Markdown syntax',
    'item.spacing': 'Space between Chinese and Latin',
    'item.fullwidth': 'Punctuation → full-width',
    'item.dedupe': 'Dedupe · sort lines',
    'item.tracking': 'Clean tracking parameters (utm_*)',
    'item.extract': 'Extract every link',
    'item.upload': 'Upload to bucket → link',
    'item.save': 'Copy to clipboard · save to Downloads',
    'bucket.title': 'Images live in your own bucket',
    'bucket.lead':
      'No official image host and no account. Point it at any S3-compatible storage and links point at your own domain — the cost and the privacy are yours.',
    'bucket.col.field': 'Field',
    'bucket.col.value': 'What goes there',
    'bucket.region': 'auto for R2, the real region for COS/OSS',
    'bucket.name': 'Bucket',
    'bucket.nameValue': 'Your bucket name',
    'bucket.public': 'Public domain',
    'bucket.publicValue': 'The domain your images are served from — the link you get back',
    'bucket.keys': 'An S3 key with write access; the secret is encrypted with the macOS Keychain',
    'bucket.note':
      'R2 is the cheapest: 10 GB free, no egress fee. Keys are content addressed, so the same screenshot twice is one object.',
    'faq.title': 'FAQ',
    'faq.q1': 'macOS says the developer cannot be verified',
    'faq.a1':
      'The dmg is ad-hoc signed, not notarised. Right-click the app in Finder → Open → Open again; or allow it under System Settings → Privacy & Security.',
    'faq.q2': 'How does it record clipboard history?',
    'faq.a2':
      'macOS has no clipboard change event, so it polls: text every 1.2 s compared by hash, images every 3 s and only when the clipboard holds no text. Side effect: when you copy two images back to back, the second may be missed.',
    'faq.q3': 'Where does the data go?',
    'faq.a3':
      'History stays in ~/Library/Application Support/喵喵剪贴板/ as an index plus image files. Two network calls exist: the PUT to your bucket, and one anonymous launch signal (random device id plus coarse city) that you can switch off in Settings.',
    'faq.q4': 'Does it need special permissions?',
    'faq.a4':
      'No system permission is needed at all: ⌥⌘V shows the panel, and text and image handling work as-is. For screenshots use macOS\'s own ⌘⇧⌃4, which already lands in the clipboard.',
    'footer.license': 'AGPL-3.0-only + commercial license',
    'footer.issue': 'Issues',
  },
};

const stored = localStorage.getItem('miaomiao-bar-site.lang');
const initial = stored ?? (navigator.language.startsWith('zh') ? 'zh' : 'en');
let lang = initial === 'en' ? 'en' : 'zh';

function t(key, vars) {
  const template = dict[lang][key] ?? dict.zh[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

function applyLanguage() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

  for (const node of document.querySelectorAll('[data-i18n]')) {
    node.textContent = t(node.dataset.i18n, { v: state.release?.version ?? '—' });
  }

  document.getElementById('lang-label').textContent = lang === 'zh' ? 'EN' : '中';
  document.getElementById('lang-toggle').addEventListener('click', toggleLanguage, { once: true });
}

function toggleLanguage() {
  lang = lang === 'zh' ? 'en' : 'zh';
  localStorage.setItem('miaomiao-bar-site.lang', lang);
  applyLanguage();
  loadRelease();
}

/* ---------- release ---------- */

const state = { release: null, busy: false };

function formatBytes(bytes) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function detectArch() {
  const ua = navigator.userAgent;
  if (/arm64|aarch64/i.test(ua)) return 'arm64';
  if (navigator.userAgentData?.architecture === 'arm') return 'arm64';
  return 'x64';
}

async function fetchRelease({ fresh = false } = {}) {
  const url = fresh ? `/api/release?fresh=1&ts=${Date.now()}` : '/api/release';
  const response = await fetch(url, {
    // 清单不进 HTTP 缓存：缓存里的旧 size 会让人按旧尺寸去切新文件。
    cache: 'no-store',
  });
  const payload = await response.json();
  if (!payload.ok || !payload.data) return null;
  return payload.data;
}

async function loadRelease() {
  const downloads = document.getElementById('downloads');
  const versionNode = document.getElementById('version');

  try {
    const data = await fetchRelease();

    if (!data) {
      downloads.dataset.unavailable = 'true';
      versionNode.textContent = t('download.unavailable');
      return;
    }

    state.release = data;
    const preferred = detectArch();

    // Re-render the static copy first: it would otherwise overwrite the size
    // suffix that the loop below appends to each label.
    applyLanguage();

    for (const link of downloads.querySelectorAll('a[data-arch]')) {
      const arch = link.dataset.arch;
      const file = data.files[arch];

      // The href is already a working download URL; the manifest only adds the
      // size suffix and marks missing builds.
      if (file) {
        delete link.dataset.unavailable;
      } else {
        link.dataset.unavailable = 'true';
      }

      const label = t(arch === 'arm64' ? 'download.arm' : 'download.intel');
      link.querySelector('span').textContent = file
        ? `${label} · ${formatBytes(file.size)}`
        : label;

      // Highlight the build that matches this machine. Ghost and primary both
      // set a background, so exactly one of them may be on a link.
      const recommended = arch === preferred && Boolean(file);
      link.classList.toggle('btn--primary', recommended);
      link.classList.toggle('btn--ghost', !recommended);
    }

    versionNode.textContent = data.version
      ? `v${data.version} · ${data.released_at ?? ''}`
      : '';
  } catch (error) {
    console.error('release manifest failed', error);
    versionNode.textContent = t('download.unavailable');
  }
}

/* ---------- download ---------- */

const CHUNK_MIN_SIZE = 20 * 1024 * 1024;
/** Parallel range requests: single connections get throttled, ranges add up. */
const CHUNK_COUNT = 8;
const CHUNK_RETRIES = 3;

/**
 * 正在进行的下载。点「取消」时用它中断全部 range 请求，并让已经攒下的分片
 * 随闭包一起释放——不留半截 Blob，也不留没用的进度条。
 */
let activeDownload = null;

function cancelDownload() {
  const current = activeDownload;
  if (!current) return;
  current.canceled = true;
  current.controller.abort();
}

/** 收起进度条并归零，下一次下载从头开始。 */
function hideProgress() {
  const wrap = document.getElementById('progress');
  if (wrap) wrap.hidden = true;
  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.width = '0%';
  const text = document.getElementById('progress-text');
  if (text) text.textContent = '';
  resetSpeed();
}

function initDownloadControls() {
  document.getElementById('progress-cancel')?.addEventListener('click', cancelDownload);

  // Esc 也能取消：下载中它比去找那颗小按钮快。
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeDownload) {
      event.preventDefault();
      cancelDownload();
    }
  });
}

/**
 * Live transfer speed. Chunks report bytes while streaming, so the window is
 * sampled over the last half second and smoothed instead of jumping around.
 */
const speedState = { at: 0, bytes: 0, speed: 0 };

function resetSpeed() {
  speedState.at = 0;
  speedState.bytes = 0;
  speedState.speed = 0;
}

/** Below 1000 KB/s keep KB (3000 KB/s is unreadable); above it, MB with one decimal. */
function formatSpeed(bytesPerSecond) {
  const speed = Math.max(0, bytesPerSecond);
  if (speed < 1000 * 1024) return `${Math.round(speed / 1024)} KB/s`;
  return `${(speed / (1024 * 1024)).toFixed(1)} MB/s`;
}

function setProgress(loaded, total) {
  const wrap = document.getElementById('progress');
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');

  const now = performance.now();
  if (!speedState.at) {
    speedState.at = now;
    speedState.bytes = loaded;
  } else {
    const elapsed = now - speedState.at;
    if (elapsed >= 500) {
      const delta = Math.max(0, loaded - speedState.bytes);
      const instant = (delta / elapsed) * 1000;
      speedState.speed = speedState.speed ? speedState.speed * 0.6 + instant * 0.4 : instant;
      speedState.at = now;
      speedState.bytes = loaded;
    }
  }

  wrap.hidden = false;
  // A retried chunk may briefly report more than the total; never show > 100%.
  const ratio = total ? Math.min(1, Math.max(0, loaded / total)) : 0;
  bar.style.width = `${Math.round(ratio * 100)}%`;

  // The user asked for the percentage to be dropped and the speed kept: KB/s
  // below 1000, MB/s above, so a fast link never shows "3000 KB/s".
  const speed = formatSpeed(speedState.speed);
  text.textContent = total
    ? `${formatBytes(loaded)} / ${formatBytes(total)} · ${speed}`
    : `${formatBytes(loaded)} · ${speed}`;
}

function createProgressReporter(total) {
  let lastBytes = 0;
  let lastAt = 0;
  return (loaded) => {
    const now = performance.now();
    // Repaint on 256 KiB of progress, but at least every 400 ms so the speed
    // number keeps moving on a slow link too.
    if (loaded < total && loaded - lastBytes < 256 * 1024 && now - lastAt < 400) return;
    lastBytes = loaded;
    lastAt = now;
    setProgress(loaded, total);
  };
}

async function readBlob(response, onBytes, signal) {
  const reader = response.body.getReader();
  const parts = [];
  try {
    while (true) {
      if (signal?.aborted) throw abortError();
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
      onBytes(value.length);
    }
    return new Blob(parts);
  } catch (error) {
    // 取消或失败：先把已攒下的分片松手，别等 GC 才回收这几十 MB。
    parts.length = 0;
    try {
      await reader.cancel();
    } catch {
      /* the stream is already gone */
    }
    throw error;
  }
}

function abortError() {
  return new DOMException('the download was canceled', 'AbortError');
}

/** AbortSignal.timeout is Safari 16+; keep the older engines working too. */
function timeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/** 用户的取消信号 + 本段超时合成一个：任一方触发都中断这段请求。 */
function linkedSignal(signal, ms) {
  const timeout = timeoutSignal(ms);
  if (!signal) return timeout;

  if (typeof AbortSignal.any === 'function') return AbortSignal.any([signal, timeout]);

  const controller = new AbortController();
  const forward = () => controller.abort();
  if (signal.aborted || timeout.aborted) controller.abort();
  else {
    signal.addEventListener('abort', forward, { once: true });
    timeout.addEventListener('abort', forward, { once: true });
  }
  return controller.signal;
}

async function fetchRange(url, start, end, onBytes, onReset, signal) {
  let lastError;

  for (let attempt = 0; attempt < CHUNK_RETRIES; attempt += 1) {
    if (signal?.aborted) throw abortError();

    try {
      const response = await fetch(url, {
        headers: { Range: `bytes=${start}-${end}` },
        // A direct connection without a proxy can hang for minutes on a single
        // range; give up early so the caller can retry or fall back.
        signal: linkedSignal(signal, 45000),
      });
      if (response.status !== 206) throw new Error(`unexpected status ${response.status}`);

      const blob = await readBlob(response, onBytes, signal);
      // 连接被中途掐断时 reader 只会读到 EOF，不会抛错。不比对长度，缺一截的
      // 碎片就会被拼进最终文件，用户双击 dmg 才看到「已损坏」。
      const expected = end - start + 1;
      if (blob.size !== expected) {
        throw new Error(`short range ${start}-${end}: ${blob.size}/${expected}`);
      }
      return blob;
    } catch (error) {
      lastError = error;
      // 用户点了取消就不再重试，否则等于“取消失败”。
      if (signal?.aborted) throw abortError();
      // The retry re-reads this range from byte 0, so the caller must drop the
      // bytes this attempt already counted.
      onReset?.();
      // Give a flaky range a moment before trying again.
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      if (signal?.aborted) throw abortError();
    }
  }

  throw lastError;
}

async function downloadFile(url, size, onProgress, signal) {
  const total = Number(size) || 0;

  if (!total || total < CHUNK_MIN_SIZE) {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`status ${response.status}`);
    let received = 0;
    const blob = await readBlob(
      response,
      (bytes) => {
        received += bytes;
        onProgress(received, total || received);
      },
      signal,
    );
    // 整包下载同样可能被截断，长度对不上就是坏包。
    if (total && blob.size !== total) {
      throw new Error(`short download: ${blob.size}/${total}`);
    }
    return blob;
  }

  const chunkSize = Math.ceil(total / CHUNK_COUNT);
  const parts = new Array(CHUNK_COUNT).fill(null);
  // Bytes counted per chunk for the current attempt, plus the chunks that are
  // done. Keeping them apart is what stops retries from pushing past 100%.
  const received = new Array(CHUNK_COUNT).fill(0);
  const committed = new Array(CHUNK_COUNT).fill(0);

  const report = () => {
    let loaded = 0;
    for (let index = 0; index < CHUNK_COUNT; index += 1) {
      loaded += committed[index] + received[index];
    }
    onProgress(Math.min(loaded, total), total);
  };

  await Promise.all(
    parts.map(async (_unused, index) => {
      const start = index * chunkSize;
      const end = Math.min(start + chunkSize - 1, total - 1);
      if (start > end) return;

      parts[index] = await fetchRange(
        url,
        start,
        end,
        (bytes) => {
          received[index] += bytes;
          report();
        },
        () => {
          received[index] = 0;
          report();
        },
        signal,
      );

      committed[index] = received[index];
      received[index] = 0;
      report();
    }),
  );

  const blob = new Blob(parts);
  // 每段都对过了，这里再对一次总量：任何一段被误判都会在这一步现形。
  if (total && blob.size !== total) {
    throw new Error(`short download: ${blob.size}/${total}`);
  }
  return blob;
}

/** 清单里给了 sha256 就拿它做终校验：长度对、内容错（错位拼接）也能挡住。 */
async function sha256Hex(blob) {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function showToast(message, durationMs = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.hidden = false;

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.hidden = true;
  }, durationMs);
}

function saveBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}

/**
 * 下载进行中把两个版本按钮一起置灰：另一条路只能走取消之后再点，
 * 否则会多出一路浏览器原生下载，那一路是没法取消的。
 */
function setDownloadsBusy(busy) {
  for (const node of document.querySelectorAll('a[data-arch]')) {
    node.classList.toggle('is-busy', busy);
    if (busy) node.setAttribute('aria-disabled', 'true');
    else node.removeAttribute('aria-disabled');
  }
}

async function startDownload(arch) {
  if (state.busy) return;

  // The manifest may still be in flight when the page first becomes clickable.
  if (!state.release) {
    showToast(t('download.wait'));
    return;
  }

  // 点之前再核对一次清单：页面可能还停在上一版，拿旧 size 切新文件会拼出坏包。
  // 刷新失败就退回页面上的数据，由长度与哈希校验兜底。
  try {
    const fresh = await fetchRelease({ fresh: true });
    if (fresh) state.release = fresh;
  } catch {
    /* 网络抖动：继续用页面上的清单 */
  }

  const file = state.release.files?.[arch];
  if (!file) return;

  const link = document.querySelector(`a[data-arch="${arch}"]`);
  if (!link) {
    // No enhanced control in the DOM: use the plain endpoint.
    window.location.href = `/api/download?arch=${arch}`;
    return;
  }

  state.busy = true;
  const label = link.querySelector('span').textContent;
  setDownloadsBusy(true);
  link.querySelector('span').textContent = t('download.wait');
  // Show the bar immediately, so the click always has visible feedback.
  resetSpeed();
  setProgress(0, file.size);

  const controller = new AbortController();
  activeDownload = { controller, canceled: false };

  try {
    const blob = await downloadFile(
      file.url,
      file.size,
      createProgressReporter(file.size),
      controller.signal,
    );
    const expectedSha = String(file.sha256 ?? '').toLowerCase();
    if (expectedSha) {
      const actual = await sha256Hex(blob);
      if (actual !== expectedSha) {
        throw new Error(`checksum mismatch: ${actual}`);
      }
    }

    saveBlob(blob, file.name);
    hideProgress();
    setDownloadsBusy(false);
    link.querySelector('span').textContent = t('download.done');

    // Confirm the finished download for three seconds, then let the button settle.
    showToast(t('download.toast', { name: file.name }), 3000);
    // A non-notarized macOS build is blocked once on first launch; show the
    // allow steps right away so the download flow does not end in a dead end.
    setTimeout(showGatekeeper, 800);

    setTimeout(() => {
      link.querySelector('span').textContent = label;
    }, 3000);
  } catch (error) {
    const canceled = controller.signal.aborted;
    // 界面先回到干净状态：进度条归零、按钮还原，不残留半截数据。
    hideProgress();
    setDownloadsBusy(false);
    link.querySelector('span').textContent = canceled ? label : t('download.failed');

    if (canceled) {
      // 取消就是取消：绝不退回直链下载，否则等于没取消。
      showToast(t('download.canceled'));
      return;
    }

    // The server sends Content-Disposition, so a plain navigation is the
    // fallback that always works when the chunked blob path is blocked.
    console.error('chunked download failed, falling back to the direct link', error);
    showToast(t('download.fallback'), 4000);
    window.location.href = file.url;

    setTimeout(() => {
      link.querySelector('span').textContent = label;
    }, 2500);
  } finally {
    activeDownload = null;
    state.busy = false;
  }
}

/* ---------- 首次打开说明（未公证应用） ---------- */

function showGatekeeper() {
  const modal = document.getElementById('gk');
  if (!modal) return;
  modal.hidden = false;
  document.getElementById('gk-ok')?.focus();
}

function closeGatekeeper() {
  const modal = document.getElementById('gk');
  if (modal) modal.hidden = true;
}

function initGatekeeper() {
  const modal = document.getElementById('gk');
  if (!modal) return;

  document.getElementById('gk-ok')?.addEventListener('click', closeGatekeeper);
  document.getElementById('gk-close')?.addEventListener('click', closeGatekeeper);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeGatekeeper();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeGatekeeper();
  });

  const copy = document.getElementById('gk-copy');
  copy?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(document.getElementById('gk-cmd')?.textContent ?? '');
      const label = copy.textContent;
      copy.textContent = t('gk.copied');
      setTimeout(() => {
        copy.textContent = label;
      }, 1600);
    } catch {
      /* clipboard may be blocked; the command stays selectable */
    }
  });
}

/* ---------- boot ---------- */

applyLanguage();
initGatekeeper();
initDownloadControls();
loadRelease();

document.getElementById('downloads').addEventListener('click', (event) => {
  const link = event.target.closest('a[data-arch]');
  if (!link) return;

  if (link.dataset.unavailable === 'true') {
    event.preventDefault();
    showToast(t('download.unavailable'));
    return;
  }

  // 下载进行中：不要再开第二条无法取消的下载
  if (state.busy) {
    event.preventDefault();
    return;
  }

  // Before the manifest arrives — or if this script failed to boot — the href
  // is already the download URL, so let the browser handle the click natively.
  if (!state.release) return;

  event.preventDefault();
  startDownload(link.dataset.arch);
});
