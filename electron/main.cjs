'use strict';

/**
 * miaomiao-bar — macOS menu bar shell.
 *
 * The app has no dock icon and no main window: a tray icon owns a single
 * frameless panel that is positioned right below it. This file owns window
 * lifecycle, tray, shortcuts and the IPC surface; clipboard reading lives in
 * clipboard.cjs, the tools in actions/, and history/settings in their own
 * Electron-free modules.
 */

const {
  app,
  BrowserWindow,
  net,
  Menu,
  dialog,
  Tray,
  globalShortcut,
  ipcMain,
  nativeImage,
  safeStorage,
  systemPreferences,
  screen,
  shell,
} = require('electron');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const clipboardBridge = require('./clipboard.cjs');
const actions = require('./actions/index.cjs');
const { HistoryStore } = require('./history.cjs');
const { SettingsStore } = require('./settings.cjs');
const { ClipboardWatcher } = require('./watcher.cjs');
const { BucketStore } = require('./storage.cjs');
const sigv4 = require('./sigv4.cjs');

// 官网地址在打包时写进 electron/site.json（见 tools/write-site-origin.cjs），
// 仓库里不写死线上域名；SITE_URL 环境变量仍然优先，方便本地指向别的站点。
const { siteOrigin, contactEmail } = require('./site-origin.cjs');

const SITE_ORIGIN = siteOrigin();
const CONTACT_EMAIL = contactEmail();
const STATS_URL = `${SITE_ORIGIN}/api/ping`;

/**
 * The manifest request is this app's only outbound call besides the launch ping, and it had no
 * timeout and no retry: on a slow dual-stack network one stalled connection looked exactly like
 * "no update server". net.fetch goes through Chromium (so system proxy and Happy Eyeballs are
 * already handled); give it real time and one retry on top.
 */
const REQUEST_TIMEOUT_MS = 15_000;
const REQUEST_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1200;

/** The error code worth showing a human; Chromium and Node hide it in different places. */
function networkCode(error) {
  const cause = error && error.cause;
  const nested = cause && Array.isArray(cause.errors) ? cause.errors[0] : null;
  return String(
    (nested && nested.code) ||
      (cause && cause.code) ||
      (error && error.code) ||
      (error && error.name) ||
      'network',
  );
}

async function requestWithRetry(url, init) {
  let lastError;
  for (let attempt = 1; attempt <= REQUEST_ATTEMPTS; attempt += 1) {
    try {
      return await net.fetch(url, { ...(init || {}), signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (error) {
      lastError = error;
      if (attempt < REQUEST_ATTEMPTS) await new Promise((done) => setTimeout(done, RETRY_DELAY_MS));
    }
  }
  throw lastError;
}

const PANEL_WIDTH = 420;
const PANEL_HEIGHT = 700;
const PANEL_MARGIN = 6;
const PANEL_EDGE = 8;
const THUMB_WIDTH = 96;

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const projectRoot = path.join(__dirname, '..');

/** @type {Tray | null} */
let tray = null;
/** @type {BrowserWindow | null} */
let panel = null;
let quitting = false;
/** Clipboard contents from before the last action, so it can be undone. */
let undoSource = null;

/** @type {HistoryStore | null} */
let history = null;
/** @type {SettingsStore | null} */
let settings = null;
/** @type {ClipboardWatcher | null} */
let watcher = null;
/** @type {BucketStore | null} */
let buckets = null;

function trayImage() {
  const image = nativeImage.createFromPath(path.join(__dirname, 'assets', 'trayTemplate.png'));
  // Template images are recoloured by macOS, so one monochrome file works in
  // both light and dark menu bars.
  image.setTemplateImage(true);
  return image;
}

function createPanel() {
  panel = new BrowserWindow({
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: true,
    hasShadow: true,
    roundedCorners: true,
    // The sticker look paints its own paper; no window material behind it.
    vibrancy: undefined,
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  panel.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  if (isDev) {
    panel.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    panel.loadFile(path.join(projectRoot, 'dist', 'index.html'));
  }

  // The renderer polls the clipboard only while it is on screen.
  panel.on('show', () => panel?.webContents.send('panel:visibility', true));
  panel.on('hide', () => panel?.webContents.send('panel:visibility', false));

  // Clicking anywhere else on the desktop dismisses the panel, like every
  // other menu bar popover on macOS.
  panel.on('blur', () => {
    if (!panel.webContents.isDevToolsOpened()) hidePanel();
  });

  panel.on('close', (event) => {
    if (!quitting) {
      event.preventDefault();
      hidePanel();
    }
  });
}

function positionPanel() {
  if (!tray || !panel) return;

  const bounds = tray.getBounds();
  const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
  const area = display.workArea;

  const centered = Math.round(bounds.x + bounds.width / 2 - PANEL_WIDTH / 2);
  const x = Math.max(
    area.x + PANEL_EDGE,
    Math.min(centered, area.x + area.width - PANEL_WIDTH - PANEL_EDGE),
  );
  const y = Math.round(bounds.y + bounds.height + PANEL_MARGIN);

  panel.setPosition(x, y, false);
}

function showPanel() {
  if (!panel) return;
  positionPanel();
  panel.show();
  panel.focus();
}

function hidePanel() {
  if (panel?.isVisible()) panel.hide();
}

function togglePanel() {
  if (panel?.isVisible()) hidePanel();
  else showPanel();
}

function contextMenu() {
  return Menu.buildFromTemplate([
    { label: '打开喵喵剪贴板', click: showPanel },
    { label: '设置…', click: () => openSettings() },
    { type: 'separator' },
    {
      label: '官网',
      click: () => shell.openExternal(SITE_ORIGIN || 'https://github.com/onblog/miaomiao-bar'),
    },
    {
      label: 'GitHub',
      click: () => shell.openExternal('https://github.com/onblog/miaomiao-bar'),
    },
    { type: 'separator' },
    { label: `版本 ${app.getVersion()}`, enabled: false },
    { label: '退出', accelerator: 'Command+Q', click: () => app.quit() },
  ]);
}

function createTray() {
  tray = new Tray(trayImage());
  tray.setToolTip('喵喵剪贴板 · Miaomiao Bar');
  tray.on('click', togglePanel);
  tray.on('right-click', () => tray.popUpContextMenu(contextMenu()));
}

/** Ask the renderer to switch to a named view (used by the tray menu). */
function openSettings() {
  showPanel();
  panel?.webContents.send('panel:view', 'settings');
}

/* ---------- history ---------- */

async function thumbOf(buffer) {
  const image = nativeImage.createFromBuffer(buffer);
  if (image.isEmpty()) return { thumb: null, width: null, height: null };

  const { width, height } = image.getSize();
  return {
    thumb: image.resize({ width: Math.min(THUMB_WIDTH, width) }).toPNG(),
    width,
    height,
  };
}

async function recordItem(entry) {
  if (!history || !settings?.get().historyEnabled) return null;

  if (entry.kind === 'text') return history.addText(entry.text);

  const { thumb, width, height } = await thumbOf(entry.buffer);
  return history.addImage({ buffer: entry.buffer, thumb, width, height, mime: entry.mime });
}

async function historyList() {
  if (!history) return [];
  const items = history.list();

  // Thumbnails are only shipped to the renderer when the full list is opened.
  const out = [];
  for (const item of items) {
    if (!item.thumbFile) {
      out.push({ ...item, thumb: null });
      continue;
    }
    const buffer = await history.readThumb(item.id);
    out.push({
      ...item,
      thumb: buffer ? `data:image/png;base64,${buffer.toString('base64')}` : null,
    });
  }
  return out;
}

async function restoreHistory(id) {
  if (!history) return { ok: false, error: 'not_found' };

  const payload = await history.read(id);
  if (!payload) return { ok: false, error: 'not_found' };

  if (payload.kind === 'text') {
    await clipboardBridge.writeText(payload.text);
    watcher?.expectText(payload.text);
  } else {
    await clipboardBridge.writeImage(payload);
    watcher?.skipNextImage();
  }

  return { ok: true };
}

/* ---------- open in Preview ---------- */

/**
 * No editor window any more: Preview already annotates, crops and rotates, and
 * whatever the user copies there comes straight back to the clipboard. We only
 * need to drop the pixels in a temp file and ask macOS to open it.
 */
async function openInPreview(image) {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(app.getPath('temp'), `miaomiao-bar-open-${stamp}.png`);
    await fs.writeFile(file, image.buffer);
    const error = await shell.openPath(file);
    return error ? { ok: false, error } : { ok: true, file };
  } catch (error) {
    console.error('opening the image failed', error);
    return { ok: false, error: 'open_failed' };
  }
}

/* ---------- uploads ---------- */

async function uploadImage(image) {
  const bucket = buckets?.active();
  if (!bucket) return { ok: false, error: 'no_bucket' };

  const key = sigv4.objectKey({ buffer: image.buffer, mime: image.mime });
  const result = await sigv4.putObject({
    endpoint: bucket.endpoint,
    region: bucket.region,
    bucket: bucket.bucketName,
    key,
    body: image.buffer,
    contentType: image.mime || 'image/png',
    accessKey: bucket.accessKey,
    secretKey: bucket.secret,
    pathStyle: bucket.pathStyle,
    publicBase: bucket.publicBase || undefined,
  });

  if (!result.ok) {
    console.error('upload failed', result.status, result.error);
    return { ok: false, error: 'upload_failed' };
  }

  return { ok: true, url: result.url };
}

async function saveImageToDownloads(image) {
  const pad = (value) => String(value).padStart(2, '0');
  const now = new Date();
  const name = [
    'miaomiao-bar',
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`,
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
  ].join('-');

  const file = path.join(app.getPath('downloads'), `${name}.png`);
  await fs.writeFile(file, image.buffer);
  return file;
}

/** Everything an action needs from the outside world. */
/* ---------- anonymous launch signal ---------- */

/**
 * A random id, generated here and stored next to the settings.
 *
 * Nothing links it to a person: no IP is stored, no user agent, no hardware.
 * Deleting the app (or this file) removes the identity with it.
 */
function deviceId() {
  const file = path.join(app.getPath('userData'), 'device.json');
  try {
    const parsed = JSON.parse(fsSync.readFileSync(file, 'utf8'));
    if (typeof parsed?.id === 'string' && parsed.id.length === 36) return parsed.id;
  } catch {
    /* first launch */
  }

  const id = randomUUID();
  try {
    fsSync.writeFileSync(file, JSON.stringify({ id }), 'utf8');
  } catch (error) {
    console.error('[stats] could not persist the device id:', error);
  }
  return id;
}

/** One ping per launch, silently skipped when the user turned reporting off. */
async function reportLaunch() {
  if (!SITE_ORIGIN) return;
  if (settings?.get().telemetry === false) return;

  try {
    await net.fetch(STATS_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ device: deviceId() }),
    });
  } catch {
    // Offline is normal and never worth surfacing.
  }
}

function actionContext() {
  return {
    hasBucket: Boolean(buckets?.hasActive()),
    linkFormat: settings?.get().linkFormat ?? 'url',
    upload: uploadImage,
    saveFile: saveImageToDownloads,
    openInPreview: (image) => openInPreview(image),
  };
}

/* ---------- IPC surface ---------- */

/**
 * Everything the panel needs in one round trip: what is on the clipboard, what
 * it can become, whether the last action can still be undone, and a cheap
 * summary of the history (no thumbnails — those wait for the full view).
 */
async function buildState() {
  const source = await clipboardBridge.readSource();
  const context = actionContext();
  const stats = history ? history.stats() : { count: 0, bytes: 0 };
  const recent = history ? history.list(3) : [];

  return {
    version: app.getVersion(),
    preview: clipboardBridge.toPreview(source),
    actions: actions.listFor(source, context),
    groups: actions.GROUP_ORDER,
    canUndo: Boolean(undoSource),
    history: {
      enabled: settings?.get().historyEnabled ?? false,
      count: stats.count,
      bytes: stats.bytes,
      recent: recent.map((item) => ({
        id: item.id,
        kind: item.kind,
        at: item.at,
        snippet: item.snippet,
      })),
    },
    settings: settings?.get() ?? {},
    buckets: buckets?.list() ?? [],
  };
}

async function runAction(id) {
  const action = actions.get(id);
  if (!action) return { ok: false, error: 'unknown_action' };

  const source = await clipboardBridge.readSource();
  if (!action.accepts.includes(source.kind)) return { ok: false, error: 'not_applicable' };

  const result = await action.run(source, actionContext());
  if (result.error) return { ok: false, error: result.error };
  if (result.ui) return { ok: true, ui: result.ui };
  if (result.handled) return { ok: true, toast: result.toast };

  if (typeof result.text === 'string') {
    if (result.html) await clipboardBridge.writeRich(result.text, result.html);
    else await clipboardBridge.writeText(result.text);
    watcher?.expectText(result.text);
  } else if (result.image) {
    await clipboardBridge.writeImage(result.image);
    watcher?.skipNextImage();
  } else {
    return { ok: false, error: 'empty_result' };
  }

  undoSource = source;
  return { ok: true, toast: result.toast };
}

async function undoLast() {
  if (!undoSource) return { ok: false, error: 'nothing_to_undo' };

  const target = undoSource;
  undoSource = null;

  await clipboardBridge.restore(target);
  if (target.kind === 'text') watcher?.expectText(target.text);
  else if (target.kind === 'image') watcher?.skipNextImage();

  return { ok: true };
}

function registerIpc() {
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    locale: app.getLocale(),
    dev: isDev,
    actionCount: actions.count,
    // 打包时由 CONTACT_EMAIL 注入；空串表示本次构建没有配置，关于面板据此隐藏邮箱。
    contactEmail: CONTACT_EMAIL,
  }));

  ipcMain.handle('panel:state', () => buildState());

  ipcMain.handle('action:run', async (_event, id) => {
    const result = await runAction(id);
    return { ...result, state: await buildState() };
  });

  ipcMain.handle('action:undo', async () => {
    const result = await undoLast();
    return { ...result, state: await buildState() };
  });

  ipcMain.handle('history:all', async () => ({
    items: await historyList(),
    stats: history ? history.stats() : { count: 0, bytes: 0 },
  }));

  ipcMain.handle('history:restore', async (_event, id) => {
    const result = await restoreHistory(id);
    return { ...result, state: await buildState() };
  });

  ipcMain.handle('history:clear', async () => {
    await history?.clear();
    return { ok: true, state: await buildState() };
  });

  // Drop a single entry; the panel offers this on hover in the full list.
  ipcMain.handle('history:delete', async (_event, id) => {
    const removed = (await history?.remove(id)) ?? false;
    if (!removed) {
      return { ok: false, error: 'not_found', state: await buildState() };
    }
    return { ok: true, state: await buildState() };
  });

  ipcMain.handle('settings:update', async (_event, patch) => {
    if (!settings) return { ok: false, error: 'unavailable' };

    const before = settings.get();
    const next = await settings.update(patch ?? {});

    if (next.launchAtLogin !== before.launchAtLogin) {
      app.setLoginItemSettings({ openAtLogin: next.launchAtLogin });
    }
    if (next.maxItems !== before.maxItems && history) {
      history.maxItems = next.maxItems;
      await history.trim();
      await history.save();
    }
    if (next.historyEnabled !== before.historyEnabled) {
      if (next.historyEnabled) watcher?.start();
      else watcher?.stop();
    }

    return { ok: true, state: await buildState() };
  });

  ipcMain.handle('appearance:set', (_event, theme) => {
    // The vibrancy material only works behind the dark panel; the light theme
    // paints its own paper, so the material is switched off.
    // Sticker themes are opaque paper in both appearances.
    panel?.setVibrancy(null);
    return true;
  });

  ipcMain.handle('clipboard:fullText', async () => {
    const source = await clipboardBridge.readSource();
    return { kind: source.kind, text: source.kind === 'text' ? source.text : '' };
  });

  ipcMain.handle('clipboard:writeText', async (_event, text) => {
    if (typeof text !== 'string') {
      return { ok: false, error: 'invalid_input', state: await buildState() };
    }

    const before = await clipboardBridge.readSource();
    await clipboardBridge.writeText(text);
    // The write came from us, so history must not record it as a new copy.
    watcher?.expectText(text);
    undoSource = before.kind === 'empty' ? null : before;

    return { ok: true, state: await buildState() };
  });

  ipcMain.handle('buckets:save', async (_event, input) => {
    if (!buckets) return { ok: false, error: 'unavailable' };
    const result = await buckets.save(input ?? {});
    return { ...result, state: await buildState() };
  });

  ipcMain.handle('buckets:remove', async (_event, id) => {
    if (!buckets) return { ok: false, error: 'unavailable' };
    const result = await buckets.remove(id);
    return { ...result, state: await buildState() };
  });

  ipcMain.handle('buckets:activate', async (_event, id) => {
    if (!buckets) return { ok: false, error: 'unavailable' };
    const result = await buckets.setActive(id);
    return { ...result, state: await buildState() };
  });

  ipcMain.handle('panel:hide', () => {
    hidePanel();
  });

  ipcMain.handle('app:quit', () => {
    app.quit();
  });

  ipcMain.handle('update:check', async () => {
    // `reason` is what the panel shows: no site address, unreachable network or a server error
    // used to collapse into one "check failed" sentence.
    if (!SITE_ORIGIN) return { ok: false, error: 'no_site', reason: 'unconfigured' };

    let response;
    try {
      response = await requestWithRetry(`${SITE_ORIGIN}/api/release`, {
        cache: 'no-store',
        headers: { 'cache-control': 'no-cache' },
      });
    } catch (error) {
      console.error('update check failed:', networkCode(error));
      return { ok: false, error: 'network', reason: 'offline', detail: networkCode(error) };
    }

    if (!response.ok) {
      return { ok: false, error: `http_${response.status}`, reason: 'server', status: response.status };
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      return { ok: false, error: 'no_manifest', reason: 'server', status: response.status };
    }

    const latest = payload?.data?.version;
    if (!payload?.ok || !latest) {
      return { ok: false, error: 'no_manifest', reason: 'server', status: response.status };
    }

    return {
      ok: true,
      current: app.getVersion(),
      latest,
      url: `${SITE_ORIGIN}/`,
      releasedAt: payload.data.released_at ?? null,
    };
  });

  ipcMain.handle('app:open-external', (_event, url) => {
    if (typeof url !== 'string' || !/^https:\/\//.test(url)) return false;
    shell.openExternal(url);
    return true;
  });
}

function registerShortcuts() {
  // Option+Command+V — show/hide the panel.
  globalShortcut.register('Alt+Command+V', togglePanel);

  // Option+Command+Z — undo the last action, even while the panel is hidden.
  globalShortcut.register('Alt+Command+Z', async () => {
    if (!undoSource) return;
    await undoLast();
    panel?.webContents.send('panel:refresh');
  });
}

/* ---------- startup ---------- */

async function initStores() {
  const userData = app.getPath('userData');

  settings = await new SettingsStore({ file: path.join(userData, 'settings.json') }).init();
  buckets = await new BucketStore({
    file: path.join(userData, 'buckets.json'),
    encrypt: (value) => {
      if (!safeStorage.isEncryptionAvailable()) throw new Error('keychain unavailable');
      return safeStorage.encryptString(value).toString('base64');
    },
    decrypt: (value) => safeStorage.decryptString(Buffer.from(value, 'base64')),
  }).init();

  history = await new HistoryStore({
    dir: path.join(userData, 'history'),
    maxItems: settings.get().maxItems,
  }).init();

  // Blobs without an index entry can only be leftovers from a crash.
  await history.sweep();

  watcher = new ClipboardWatcher({
    readText: () => clipboardBridge.readText(),
    hasImage: () => clipboardBridge.hasImage(),
    readImage: async () => {
      const source = await clipboardBridge.readSource();
      return source.kind === 'image' ? source : null;
    },
    onItem: recordItem,
  });

  if (settings.get().historyEnabled) watcher.start();
}

async function devCapture(target) {
  showPanel();
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const forced = process.env.BAR_TOOL_LANG;
  if (forced === 'zh' || forced === 'en') {
    await panel.webContents.executeJavaScript(
      `localStorage.setItem('miaomiao-bar.lang', ${JSON.stringify(forced)}); location.reload();`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1400));
  }

  if (process.env.BAR_TOOL_THEME) {
    await panel.webContents.executeJavaScript(
      `localStorage.setItem('miaomiao-bar.theme', ${JSON.stringify(process.env.BAR_TOOL_THEME)}); location.reload()`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  if (process.env.BAR_TOOL_EVAL) {
    const value = await panel.webContents.executeJavaScript(process.env.BAR_TOOL_EVAL);
    console.log('[eval]', JSON.stringify(value));
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  if (process.env.BAR_TOOL_BUCKET) {
    await panel.webContents.executeJavaScript(
      `window.bar.bucketsSave(${process.env.BAR_TOOL_BUCKET}).then(() => location.reload())`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1600));
  }

  if (process.env.BAR_TOOL_VIEW) {
    const targets = { history: 'history-all', bucket: 'bucket-add' };
    const buttonId = targets[process.env.BAR_TOOL_VIEW] ?? process.env.BAR_TOOL_VIEW;
    await panel.webContents.executeJavaScript(
      `document.getElementById(${JSON.stringify(buttonId)})?.click()`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1400));
  }

  if (process.env.BAR_TOOL_CHIP) {
    await panel.webContents.executeJavaScript(
      `document.querySelectorAll('.chip-item')[${Number(process.env.BAR_TOOL_CHIP)}]?.click()`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  // Optionally exercise an action before the screenshot: proves the click path.
  if (process.env.BAR_TOOL_CLICK) {
    await panel.webContents.executeJavaScript(
      `document.querySelector('[data-id="${process.env.BAR_TOOL_CLICK}"]')?.click()`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1400));
  }

  const image = await panel.webContents.capturePage();
  await fs.writeFile(target, image.toPNG());
  console.log(`[capture] wrote ${target}`);
  app.quit();
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showPanel);

  app.whenReady().then(async () => {
    // A menu bar app never shows a dock icon.
    app.dock?.hide();
    app.setName('喵喵剪贴板');

    await initStores();

    createPanel();
    createTray();
    registerIpc();
    registerShortcuts();
    reportLaunch();

    app.on('activate', showPanel);

    if (process.env.BAR_TOOL_CAPTURE) {
      devCapture(process.env.BAR_TOOL_CAPTURE).catch((error) => {
        console.error('[capture] failed', error);
        app.quit();
      });
    }
  });

  app.on('window-all-closed', () => {
    // The tray keeps the app alive even with every window closed.
  });

  app.on('before-quit', () => {
    quitting = true;
    watcher?.stop();
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
