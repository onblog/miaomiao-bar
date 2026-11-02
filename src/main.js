/**
 * Panel renderer.
 *
 * Three views share one 400×600 panel: the main action view, the clipboard
 * history and the settings page. The main process decides which actions apply
 * to the current clipboard; this file paints them and sends the choice back.
 */

import { applyStatic, nextLang, pickLocalised, setLang, storedLang, t } from './i18n.js';
import { actionIcon, groupIcon } from './icons.js';
import { isNewer } from './update.js';

const POLL_MS = 900;
const CLEAR_ARM_MS = 3000;

const nodes = {
  back: document.getElementById('back'),
  brand: document.getElementById('brand'),
  viewTitle: document.getElementById('view-title'),
  version: document.getElementById('version'),
  langToggle: document.getElementById('lang-toggle'),
  themeToggle: document.getElementById('theme-toggle'),
  settings: document.getElementById('settings'),
  editSave: document.getElementById('edit-save'),
  editCancel: document.getElementById('edit-cancel'),

  viewMain: document.getElementById('view-main'),
  viewHistory: document.getElementById('view-history'),
  viewSettings: document.getElementById('view-settings'),

  clipMeta: document.getElementById('clip-meta'),
  preview: document.getElementById('preview'),
  actionCount: document.getElementById('action-count'),
  actions: document.getElementById('actions'),

  historyChips: document.getElementById('history-chips'),
  historyAll: document.getElementById('history-all'),
  historyStats: document.getElementById('history-stats'),
  historyClear: document.getElementById('history-clear'),
  hlist: document.getElementById('hlist'),

  setHistory: document.getElementById('set-history'),
  setFormat: document.getElementById('set-format'),
  bucketList: document.getElementById('bucket-list'),
  bucketAdd: document.getElementById('bucket-add'),
  viewBucket: document.getElementById('view-bucket'),
  bName: document.getElementById('b-name'),
  bEndpoint: document.getElementById('b-endpoint'),
  bRegion: document.getElementById('b-region'),
  bBucket: document.getElementById('b-bucket'),
  bPublic: document.getElementById('b-public'),
  bAccess: document.getElementById('b-access'),
  bSecret: document.getElementById('b-secret'),
  bPath: document.getElementById('b-path'),
  bSave: document.getElementById('b-save'),
  bDelete: document.getElementById('b-delete'),
  setMax: document.getElementById('set-max'),
  checkUpdate: document.getElementById('check-update'),
  close: document.getElementById('close'),
  updateHint: document.getElementById('update-hint'),
  setLaunch: document.getElementById('set-launch'),
  setTelemetry: document.getElementById('set-telemetry'),
  settingsUsage: document.getElementById('settings-usage'),
  aboutVersion: document.getElementById('about-version'),
  aboutGithub: document.getElementById('about-github'),
  aboutSite: document.getElementById('about-site'),

  foot: document.getElementById('foot'),
  dot: document.getElementById('dot'),
  status: document.getElementById('status'),
  undo: document.getElementById('undo-inline'),
  toast: document.getElementById('toast'),
};

const state = {
  view: 'main',
  version: '',
  locale: 'zh',
  preview: { kind: 'empty' },
  actions: [],
  groups: [],
  canUndo: false,
  history: { enabled: true, count: 0, bytes: 0, recent: [] },
  settings: { maxItems: 100, launchAtLogin: false, historyEnabled: true },
  historyItems: [],
  /** Non-null while the clipboard text is being edited inline. */
  editing: null,
  buckets: [],
  editingBucketId: null,
  signature: '',
  running: false,
  pollTimer: null,
  toastTimer: null,
  clearTimer: null,
  clearArmed: false,
  statusKey: 'status.ready',
  statusIsError: false,
};

/* ---------- helpers ---------- */

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatAge(iso) {
  const elapsed = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return t('age.now');
  if (minutes < 60) return t('age.minutes', { n: minutes });

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('age.hours', { n: hours });
  return t('age.days', { n: Math.floor(hours / 24) });
}

function showToast(message) {
  nodes.toast.textContent = message;
  nodes.toast.hidden = false;
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    nodes.toast.hidden = true;
  }, 1900);
}

/* ---------- appearance ---------- */

const THEME_KEY = 'miaomiao-bar.theme';

function currentTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function applyTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;

  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* ignore */
  }

  window.bar.setAppearance(next);
}

function storedTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

/* ---------- inline editing ---------- */

function setEditControls(editing) {
  // The entry points now live in the action list; only save/cancel stay up here.
  nodes.editSave.hidden = !editing;
  nodes.editCancel.hidden = !editing;
}

function renderEditor() {
  nodes.preview.className = 'preview';
  nodes.preview.replaceChildren();

  const area = document.createElement('textarea');
  area.className = 'preview__editor';
  area.value = state.editing ?? '';
  area.spellcheck = false;
  area.setAttribute('aria-label', t('clip.edit'));

  area.addEventListener('input', () => {
    state.editing = area.value;
  });

  area.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      saveEdit();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      cancelEdit();
    }
  });

  nodes.preview.append(area);
  requestAnimationFrame(() => area.focus());
}

async function startEdit() {
  try {
    const full = await window.bar.fullText();
    if (full.kind !== 'text') return;

    state.editing = full.text;
    renderEditor();
    setEditControls(true);
    // The hint belongs in the status line; the header only holds the buttons.
    setStatus('edit.hint');
  } catch (error) {
    console.error('could not open the editor', error);
  }
}

function cancelEdit() {
  state.editing = null;
  setEditControls(false);
  state.signature = '';
  renderPreview(state.preview);
  renderFooter();
}

async function saveEdit() {
  if (state.editing === null) return;

  try {
    const result = await window.bar.writeText(state.editing);
    state.editing = null;
    setEditControls(false);

    state.signature = '';
    paint(result.state ?? (await window.bar.state()));
    setStatus('edit.saved');
    showToast(t('edit.saved'));
  } catch (error) {
    console.error('saving the edit failed', error);
  }
}

/* ---------- main view ---------- */

function previewSignature(preview) {
  if (preview.kind === 'image') {
    return `i:${preview.width}x${preview.height}:${preview.stamp ?? preview.dataUrl.length}`;
  }
  if (preview.kind === 'text') return `t:${preview.text}`;
  return 'empty';
}

function renderPreview(preview) {
  nodes.preview.className = 'preview';
  nodes.preview.replaceChildren();

  if (preview.kind === 'image') {
    nodes.preview.classList.add('preview--image');
    const img = new Image();
    img.className = 'preview__img';
    img.src = preview.dataUrl;
    img.alt = '';
    nodes.preview.append(img);
    nodes.clipMeta.textContent = t('clip.imageMeta', { w: preview.width, h: preview.height });
    setEditControls(false);
    return;
  }

  if (preview.kind === 'text') {
    const pre = document.createElement('pre');
    pre.className = 'preview__text';
    pre.textContent = preview.text;
    nodes.preview.append(pre);

    const size = t('clip.textMeta', { n: preview.length });
    nodes.clipMeta.textContent = preview.rich ? `${size} · ${t('clip.rich')}` : size;
    setEditControls(false);
    return;
  }

  const box = document.createElement('div');
  box.className = 'preview__empty';
  const strong = document.createElement('strong');
  strong.textContent = t('clip.emptyTitle');
  const span = document.createElement('span');
  span.textContent = t('clip.emptyDesc');
  box.append(strong, span);
  nodes.preview.append(box);
  nodes.clipMeta.textContent = '';
  setEditControls(false);
}

function actionButton(action) {
  const button = document.createElement('button');
  button.className = 'action';
  button.type = 'button';
  button.dataset.id = action.id;
  button.title = pickLocalised(action.title);

  const icon = document.createElement('span');
  icon.className = 'action__icon';
  icon.innerHTML = actionIcon(action.id);

  const name = document.createElement('span');
  name.className = 'action__name';
  name.textContent = pickLocalised(action.title);

  button.append(icon, name);
  button.addEventListener('click', () => runAction(action.id));
  return button;
}

function renderActions() {
  nodes.actions.replaceChildren();
  nodes.actionCount.textContent = state.actions.length
    ? t('actions.count', { n: state.actions.length })
    : '';

  if (state.actions.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'actions__empty';
    empty.textContent =
      state.preview.kind === 'image'
        ? t('actions.imageEmpty')
        : state.preview.kind === 'empty'
          ? t('status.empty')
          : t('err.not_applicable');
    nodes.actions.append(empty);
    return;
  }

  // Keep the registry's group order, skip groups that filtered out entirely.
  for (const group of state.groups) {
    const items = state.actions.filter((action) => action.group === group);
    if (items.length === 0) continue;

    const wrapper = document.createElement('div');
    wrapper.className = 'group';

    const head = document.createElement('div');
    head.className = 'group__head';

    const icon = document.createElement('span');
    icon.className = 'group__icon';
    icon.innerHTML = groupIcon(group);

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = t(`group.${group}`);

    const count = document.createElement('span');
    count.className = 'group__count';
    count.textContent = String(items.length);

    head.append(icon, tag, count);

    const grid = document.createElement('div');
    grid.className = 'group__grid';
    for (const item of items) grid.append(actionButton(item));

    wrapper.append(head, grid);
    nodes.actions.append(wrapper);
  }
}

function renderHistoryStrip() {
  nodes.historyChips.replaceChildren();

  if (!state.history.enabled) {
    const note = document.createElement('span');
    note.className = 'history-strip__note';
    note.textContent = t('history.disabled');
    nodes.historyChips.append(note);
    nodes.historyAll.disabled = true;
    return;
  }

  nodes.historyAll.disabled = state.history.count === 0;

  for (const item of state.history.recent) {
    const chip = document.createElement('button');
    chip.className = 'chip-item';
    chip.type = 'button';
    chip.dataset.id = item.id;
    chip.title = item.kind === 'image' ? t('history.imagePlain') : (item.snippet ?? '');

    if (item.kind === 'image') {
      chip.classList.add('chip-item--image');
      chip.textContent = '▧';
    } else {
      chip.textContent = (item.snippet ?? '?').trim().slice(0, 1) || 'T';
    }

    chip.addEventListener('click', () => restoreHistory(item.id));
    nodes.historyChips.append(chip);
  }
}

function renderFooter() {
  const mainView = state.view === 'main';
  nodes.foot.hidden = !mainView;
  if (!mainView) return;

  nodes.undo.hidden = !state.canUndo;

  if (state.statusIsError) {
    nodes.dot.dataset.state = 'bad';
    nodes.status.textContent = t(state.statusKey);
    return;
  }

  if (state.preview.kind === 'empty') {
    nodes.dot.dataset.state = 'idle';
  } else if (state.running) {
    nodes.dot.dataset.state = 'busy';
  } else {
    nodes.dot.dataset.state = 'ok';
  }

  nodes.status.textContent = t(state.statusKey);
}

function paint(payload) {
  const previousIds = state.actions.map((action) => action.id).join(',');

  state.preview = payload.preview;
  state.actions = payload.actions;
  state.groups = payload.groups;
  state.canUndo = payload.canUndo;
  state.history = payload.history;
  state.settings = payload.settings;
  state.buckets = payload.buckets ?? [];

  if (state.editing !== null) {
    // The clipboard can change under the editor; keep the user's text intact.
    renderFooter();
    return;
  }

  const ids = state.actions.map((action) => action.id).join(',');
  const recentIds = state.history.recent.map((item) => item.id).join(',');
  const signature = [
    previewSignature(payload.preview),
    ids,
    state.canUndo,
    state.history.enabled,
    state.history.count,
    recentIds,
  ].join('|');

  const changed = ids !== previousIds || signature !== state.signature;
  if (!changed) {
    renderFooter();
    return;
  }

  state.signature = signature;

  renderPreview(state.preview);
  renderActions();
  renderHistoryStrip();
  renderFooter();

  if (state.view === 'settings') renderSettings();
}

/* ---------- views ---------- */

function setView(view) {
  state.view = view;

  nodes.viewMain.hidden = view !== 'main';
  nodes.viewHistory.hidden = view !== 'history';
  nodes.viewSettings.hidden = view !== 'settings';
  nodes.viewBucket.hidden = view !== 'bucket';

  nodes.back.hidden = view === 'main';
  nodes.brand.hidden = view !== 'main';
  nodes.viewTitle.hidden = view === 'main';
  nodes.settings.hidden = view === 'settings' || view === 'bucket';

  if (view === 'history') nodes.viewTitle.textContent = t('history.strip');
  if (view === 'settings') nodes.viewTitle.textContent = t('settings.title');
  if (view === 'bucket') nodes.viewTitle.textContent = t('bucket.title');

  renderFooter();

  if (view === 'history') {
    stopPolling();
    loadHistory();
  } else if (view === 'settings' || view === 'bucket') {
    stopPolling();
    if (view === 'settings') renderSettings();
  } else {
    startPolling();
  }
}

/* ---------- history view ---------- */

async function loadHistory() {
  try {
    const { items } = await window.bar.historyAll();
    state.historyItems = items;
    renderHistoryList();
  } catch (error) {
    console.error('history load failed', error);
  }
}

function historyRow(item) {
  const row = document.createElement('li');
  row.className = 'hrow';
  row.dataset.id = item.id;

  const thumb = document.createElement('div');
  thumb.className = 'hrow__thumb';
  if (item.kind === 'image') {
    if (item.thumb) {
      const img = new Image();
      img.src = item.thumb;
      img.alt = '';
      thumb.append(img);
    } else {
      thumb.textContent = '▧';
      thumb.classList.add('hrow__thumb--plain');
    }
  } else {
    thumb.textContent = (item.snippet ?? 'T').trim().slice(0, 1) || 'T';
    thumb.classList.add('hrow__thumb--text');
  }

  const meta = document.createElement('div');
  meta.className = 'hrow__meta';

  const line = document.createElement('div');
  line.className = 'hrow__line';
  line.textContent =
    item.kind === 'image'
      ? t(item.width ? 'history.image' : 'history.imagePlain', { w: item.width, h: item.height })
      : (item.snippet ?? '');

  const time = document.createElement('div');
  time.className = 'hrow__time';
  time.textContent = formatAge(item.at);

  meta.append(line, time);

  // Delete affordance: revealed on hover/focus, so a row still reads as one tap
  // target that restores the entry.
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'hrow__del';
  remove.dataset.i18nTitle = 'history.delete';
  remove.title = t('history.delete');
  remove.setAttribute('aria-label', t('history.delete'));
  remove.innerHTML =
    '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M2.8 4.4h10.4" />' +
    '<path d="M6.4 4.4V2.9h3.2v1.5" />' +
    '<path d="M4.4 4.4l.5 7.9a1.5 1.5 0 0 0 1.5 1.4h2.8a1.5 1.5 0 0 0 1.5-1.4l.5-7.9" />' +
    '</svg>';
  remove.addEventListener('click', (event) => {
    event.stopPropagation();
    event.preventDefault();
    deleteHistoryItem(item, row);
  });

  row.append(thumb, meta, remove);
  row.addEventListener('click', () => restoreHistory(item.id, { backToMain: true }));
  return row;
}

const HROW_LEAVE_MS = 160;

async function deleteHistoryItem(item, row) {
  if (row.dataset.leaving === '1') return;
  row.dataset.leaving = '1';
  row.classList.add('hrow--leaving');

  try {
    const result = await window.bar.historyDelete(item.id);
    paint(result.state);

    if (!result.ok) {
      row.classList.remove('hrow--leaving');
      delete row.dataset.leaving;
      loadHistory();
      showToast(t(`err.${result.error}`));
      return;
    }

    state.historyItems = state.historyItems.filter((entry) => entry.id !== item.id);
    // Let the row finish fading before the list closes the gap.
    setTimeout(() => {
      row.classList.remove('hrow--leaving');
      renderHistoryList();
    }, HROW_LEAVE_MS + 20);
    showToast(t('history.deleted'));
  } catch (error) {
    console.error('history delete failed', error);
    row.classList.remove('hrow--leaving');
    delete row.dataset.leaving;
  }
}

function renderHistoryList() {
  nodes.hlist.replaceChildren();
  nodes.historyClear.textContent = state.clearArmed ? t('history.clearConfirm') : t('history.clear');

  nodes.historyStats.textContent = t('history.stats', {
    n: state.history.count,
    size: formatBytes(state.history.bytes),
  });

  if (state.historyItems.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'hlist__empty';
    empty.textContent = state.history.enabled ? t('history.empty') : t('history.disabled');
    nodes.hlist.append(empty);
    return;
  }

  for (const item of state.historyItems) nodes.hlist.append(historyRow(item));
}

/* ---------- update check ---------- */

const UPDATE_NOTICE_KEY = 'miaomiao-bar.update-notified';
const UPDATE_INTERVAL_MS = 6 * 60 * 60 * 1000;

/** Remember which day we last showed a reminder, so it fires at most daily. */
function today() {
  return new Date().toISOString().slice(0, 10);
}

function setUpdateHint(key, version) {
  if (!nodes.updateHint) return;
  const text = version ? t(key).replace('{v}', version) : t(key);
  nodes.updateHint.textContent = text;
}

/** Failure reasons reported by the main process; each gets its own sentence. */
const UPDATE_FAIL_KEYS = {
  unconfigured: 'settings.updateNoSite',
  offline: 'settings.updateOffline',
  server: 'settings.updateServer',
};

function setUpdateFailHint(result) {
  if (!nodes.updateHint) return;
  const key = UPDATE_FAIL_KEYS[result?.reason] || 'settings.updateFailed';
  nodes.updateHint.textContent = t(key).replace('{status}', result?.status ? String(result.status) : '—');
}

/**
 * Ask the site for its release manifest.
 *
 * Auto checks are silent unless something new turns up; a manual check always
 * reports, even when the answer is "you are current".
 */
async function checkForUpdates({ manual = false } = {}) {
  if (nodes.checkUpdate) nodes.checkUpdate.disabled = true;
  if (manual) setUpdateHint('settings.updateChecking');

  try {
    const result = await window.bar.checkUpdate();
    if (!result?.ok) {
      if (manual) setUpdateFailHint(result);
      return null;
    }

    const newer = isNewer(result.current, result.latest);
    setUpdateHint(newer ? 'settings.updateNewer' : 'settings.updateLatest', newer ? result.latest : result.current);

    if (newer && (manual || localStorage.getItem(UPDATE_NOTICE_KEY) !== today())) {
      showToast(t('update.available').replace('{v}', result.latest));
      localStorage.setItem(UPDATE_NOTICE_KEY, today());
    }

    return result;
  } finally {
    if (nodes.checkUpdate) nodes.checkUpdate.disabled = false;
  }
}

function startUpdateChecks() {
  checkForUpdates().catch((error) => console.error('update check failed', error));
  setInterval(() => {
    checkForUpdates().catch((error) => console.error('update check failed', error));
  }, UPDATE_INTERVAL_MS);
}

/* ---------- settings view ---------- */

function renderBucketList() {
  nodes.bucketList.replaceChildren();

  if (state.buckets.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'buckets__empty';
    empty.textContent = t('bucket.empty');
    nodes.bucketList.append(empty);
    return;
  }

  for (const bucket of state.buckets) {
    const row = document.createElement('li');
    row.className = 'bucket';

    const pick = document.createElement('button');
    pick.type = 'button';
    pick.className = `bucket__pick${bucket.active ? ' is-active' : ''}`;
    pick.textContent = bucket.active ? '●' : '○';
    pick.title = bucket.name;
    pick.addEventListener('click', () => activateBucket(bucket.id));

    const meta = document.createElement('div');
    meta.className = 'bucket__meta';

    const name = document.createElement('span');
    name.className = 'bucket__name';
    name.textContent = bucket.name;

    const host = document.createElement('span');
    host.className = 'bucket__host';
    host.textContent = bucket.bucketName;

    meta.append(name, host);

    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'link';
    edit.textContent = t('bucket.edit');
    edit.addEventListener('click', () => openBucketForm(bucket.id));

    row.append(pick, meta, edit);
    nodes.bucketList.append(row);
  }
}

function openBucketForm(id) {
  const bucket = state.buckets.find((item) => item.id === id) ?? null;
  state.editingBucketId = bucket?.id ?? null;

  nodes.bName.value = bucket?.name ?? '';
  nodes.bEndpoint.value = bucket?.endpoint ?? '';
  nodes.bRegion.value = bucket?.region ?? 'auto';
  nodes.bBucket.value = bucket?.bucketName ?? '';
  nodes.bPublic.value = bucket?.publicBase ?? '';
  nodes.bAccess.value = bucket?.accessKey ?? '';
  nodes.bSecret.value = '';
  nodes.bPath.setAttribute('aria-checked', String(bucket ? bucket.pathStyle : true));
  nodes.bDelete.hidden = !bucket;

  setView('bucket');
}

async function saveBucket() {
  const input = {
    id: state.editingBucketId ?? undefined,
    name: nodes.bName.value,
    endpoint: nodes.bEndpoint.value,
    region: nodes.bRegion.value,
    bucket: nodes.bBucket.value,
    publicBase: nodes.bPublic.value,
    accessKey: nodes.bAccess.value,
    secret: nodes.bSecret.value,
    pathStyle: nodes.bPath.getAttribute('aria-checked') === 'true',
  };

  try {
    const result = await window.bar.bucketsSave(input);
    if (!result.ok) {
      showToast(t(`err.${result.error}`));
      return;
    }
    paint(result.state);
    setView('settings');
    showToast(t('bucket.saved'));
  } catch (error) {
    console.error('bucket save failed', error);
  }
}

async function deleteBucket() {
  if (!state.editingBucketId) return;

  try {
    const result = await window.bar.bucketsRemove(state.editingBucketId);
    paint(result.state);
    setView('settings');
    showToast(t('bucket.deleted'));
  } catch (error) {
    console.error('bucket delete failed', error);
  }
}

async function activateBucket(id) {
  try {
    const result = await window.bar.bucketsActivate(id);
    if (result.state) paint(result.state);
    renderSettings();
  } catch (error) {
    console.error('bucket activate failed', error);
  }
}

function renderSettings() {
  nodes.setHistory.setAttribute('aria-checked', String(Boolean(state.settings.historyEnabled)));
  nodes.setLaunch.setAttribute('aria-checked', String(Boolean(state.settings.launchAtLogin)));
  nodes.setTelemetry?.setAttribute('aria-checked', String(state.settings.telemetry !== false));
  nodes.setMax.value = String(state.settings.maxItems ?? 100);
  nodes.setFormat.value = state.settings.linkFormat ?? 'url';

  renderBucketList();

  nodes.settingsUsage.textContent = t('history.stats', {
    n: state.history.count,
    size: formatBytes(state.history.bytes),
  });
  nodes.aboutVersion.textContent = `v${state.version}`;
}

async function updateSetting(patch) {
  try {
    const result = await window.bar.updateSettings(patch);
    if (result.state) paint(result.state);
    renderSettings();
    if (state.view === 'history') loadHistory();
  } catch (error) {
    console.error('settings update failed', error);
  }
}

/* ---------- actions ---------- */

function setStatus(key, isError = false) {
  state.statusKey = key;
  state.statusIsError = isError;
  renderFooter();
}

async function refresh() {
  try {
    paint(await window.bar.state());
  } catch (error) {
    console.error('panel state failed', error);
  }
}

async function runAction(id) {
  if (state.running) return;

  state.running = true;
  setStatus('status.running');

  try {
    const result = await window.bar.run(id);
    state.running = false;
    paint(result.state);

    if (result.ok && result.ui === 'edit_text') {
      await startEdit();
      return;
    }
    if (result.ok && result.ui === 'edit_image') {
      await window.bar.editImage(currentTheme());
      return;
    }

    if (result.ok) {
      setStatus(result.toast ?? 'status.done');
      cheer();
    } else {
      setStatus(`err.${result.error}`, true);
    }
  } catch (error) {
    state.running = false;
    console.error('action failed', error);
    setStatus('err.unknown_action', true);
  }
}

/** One happy bounce on the footer dot — quieter than a toast, and no overlap. */
function cheer() {
  nodes.dot.classList.remove('is-cheer');
  // Force a reflow so the animation can restart on consecutive actions.
  void nodes.dot.offsetWidth;
  nodes.dot.classList.add('is-cheer');
  setTimeout(() => nodes.dot.classList.remove('is-cheer'), 500);
}

async function undo() {
  try {
    const result = await window.bar.undo();
    paint(result.state);
    setStatus(result.ok ? 'status.undone' : `err.${result.error}`, !result.ok);
  } catch (error) {
    console.error('undo failed', error);
  }
}

async function restoreHistory(id, { backToMain = false } = {}) {
  try {
    const result = await window.bar.historyRestore(id);
    if (!result.ok) {
      setStatus(`err.${result.error}`, true);
      return;
    }

    paint(result.state);
    if (backToMain) setView('main');
    // No toast here: picking something you just copied is self-evident, and the
    // banner used to fire on every single click.
    setStatus('history.restored');
  } catch (error) {
    console.error('history restore failed', error);
  }
}

async function clearHistory() {
  if (!state.clearArmed) {
    state.clearArmed = true;
    nodes.historyClear.textContent = t('history.clearConfirm');
    clearTimeout(state.clearTimer);
    state.clearTimer = setTimeout(() => {
      state.clearArmed = false;
      nodes.historyClear.textContent = t('history.clear');
    }, CLEAR_ARM_MS);
    return;
  }

  clearTimeout(state.clearTimer);
  state.clearArmed = false;
  nodes.historyClear.textContent = t('history.clear');

  try {
    const result = await window.bar.historyClear();
    paint(result.state);
    loadHistory();
  } catch (error) {
    console.error('history clear failed', error);
  }
}

/* ---------- keyboard + wiring ---------- */

function bindEvents() {
  nodes.back.addEventListener('click', () => setView('main'));
  nodes.settings.addEventListener('click', () => setView('settings'));
  nodes.historyAll.addEventListener('click', () => setView('history'));
  nodes.historyClear.addEventListener('click', clearHistory);

  nodes.langToggle.addEventListener('click', () => {
    setLang(nextLang());
    updateChrome();
    // Force a repaint so action names and meta text switch language too.
    state.signature = '';
    paint({
      preview: state.preview,
      actions: state.actions,
      groups: state.groups,
      canUndo: state.canUndo,
      history: state.history,
      settings: state.settings,
    });
    if (state.view === 'history') renderHistoryList();
    if (state.view === 'settings') renderSettings();
    if (state.view === 'bucket') nodes.viewTitle.textContent = t('bucket.title');
  });

  nodes.undo.addEventListener('click', undo);

  nodes.close?.addEventListener('click', () => window.bar.hide());

  nodes.checkUpdate?.addEventListener('click', () => {
    checkForUpdates({ manual: true }).catch((error) => console.error('update check failed', error));
  });


  nodes.themeToggle.addEventListener('click', () => {
    applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
  });

  nodes.editSave.addEventListener('click', saveEdit);
  nodes.editCancel.addEventListener('click', cancelEdit);

  nodes.setHistory.addEventListener('click', () =>
    updateSetting({ historyEnabled: !state.settings.historyEnabled }),
  );
  nodes.setTelemetry?.addEventListener('click', () =>
    updateSetting({ telemetry: state.settings.telemetry === false }),
  );

  nodes.setLaunch.addEventListener('click', () =>
    updateSetting({ launchAtLogin: !state.settings.launchAtLogin }),
  );
  nodes.setMax.addEventListener('change', () =>
    updateSetting({ maxItems: Number(nodes.setMax.value) }),
  );
  nodes.setFormat.addEventListener('change', () =>
    updateSetting({ linkFormat: nodes.setFormat.value }),
  );

  nodes.bucketAdd.addEventListener('click', () => openBucketForm(null));
  nodes.bSave.addEventListener('click', saveBucket);
  nodes.bDelete.addEventListener('click', deleteBucket);
  nodes.bPath.addEventListener('click', () => {
    const next = nodes.bPath.getAttribute('aria-checked') !== 'true';
    nodes.bPath.setAttribute('aria-checked', String(next));
  });

  document.getElementById('donate')?.addEventListener('click', () => {
    // The tip link points at the author's profile, not the repository.
    window.bar.openExternal('https://github.com/onblog');
  });

  document.getElementById('about-author')?.addEventListener('click', () => {
    window.bar.openExternal('https://github.com/onblog');
  });


  nodes.aboutGithub.addEventListener('click', () =>
    window.bar.openExternal('https://github.com/onblog/miaomiao-bar'),
  );
  // 官网地址来自构建环境（VITE_SITE_URL），仓库里不写死线上域名。
  // 构建时没注入就退回仓库首页，避免出现点了没反应的死按钮。
  const siteUrl = import.meta.env.VITE_SITE_URL ?? '';
  nodes.aboutSite.addEventListener('click', () =>
    window.bar.openExternal(siteUrl || 'https://github.com/onblog/miaomiao-bar'),
  );

  document.addEventListener('keydown', (event) => {
    if (state.editing !== null) return;

    if (event.key === 'Escape') {
      if (state.view !== 'main') setView('main');
      else window.bar.hide();
      return;
    }

    if (state.view !== 'main') return;

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      undo();
    }
  });
}

function startPolling() {
  if (state.pollTimer) return;
  state.pollTimer = setInterval(refresh, POLL_MS);
}

function stopPolling() {
  clearInterval(state.pollTimer);
  state.pollTimer = null;
}

function updateChrome() {
  nodes.langToggle.textContent = nextLang() === 'en' ? 'EN' : '中';
  nodes.version.textContent = state.version ? `v${state.version}` : '';
}

async function init() {
  const info = await window.bar.info();
  state.version = info.version;
  state.locale = info.locale ?? 'zh';

  // 邮箱来自打包时注入的 site.json，仓库里不出现真实地址；没配置就隐藏这一项。
  const emailItem = document.getElementById('about-email');
  const emailText = document.getElementById('about-email-text');
  const contactEmail = String(info.contactEmail ?? '');
  if (emailItem && contactEmail) {
    if (emailText) emailText.textContent = contactEmail;
    emailItem.hidden = false;
  }

  setLang(storedLang() ?? (state.locale.startsWith('zh') ? 'zh' : 'en'));
  applyStatic();

  bindEvents();
  applyTheme(storedTheme() ?? 'light');
startUpdateChecks();
  updateChrome();
  renderPreview(state.preview);
  renderHistoryStrip();
  renderFooter();
  await refresh();

  window.bar.onVisibility((visible) => {
    if (!visible) {
      stopPolling();
      return;
    }
    if (state.view === 'main') {
      // Chromium focuses the first focusable element when a window appears; park
      // it on the view itself so the buttons never light up on open.
      nodes.viewMain.focus({ preventScroll: true });
      refresh();
      startPolling();
    }
  });

  window.bar.onRefresh(() => {
    refresh();
  });

  window.bar.onNotice((notice) => {
    if (!notice?.key) return;
    const detail = notice.detail ? ` (${notice.detail})` : '';
    showToast(`${t(notice.key)}${detail}`);
    setStatus(notice.key);
  });

  window.bar.onView((view) => {
    setView(view === 'history' ? 'history' : 'settings');
  });
}

init().catch((error) => {
  console.error('panel init failed', error);
});
