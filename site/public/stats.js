/**
 * 使用数据页面：全球分布地图 + 城市明细 + 每日活跃。
 * 地图数据是构建时预渲染的 SVG path（/assets/world-map.json），运行时零依赖。
 */

const messages = {
  zh: {
    brand: '喵喵剪贴板',
    'nav.home': '首页',
    'nav.sibling': '喵喵笔记',
    'stats.title': '使用数据',
    'stats.sub': '只统计匿名启动信号，不收集个人信息，不含 IP 与设备指纹。',
    'stats.total': '总用户量',
    'stats.today': '今日活跃',
    'stats.week': '近 7 日活跃',
    'stats.cities': '城市分布',
    'stats.map': '全球分布',
    'stats.daily': '每日活跃',
    'stats.empty': '还没有数据',
    'stats.legend': '设备数',
    'stats.legend.none': '无',
    'stats.legend.one': '1–2',
    'stats.legend.few': '3–5',
    'stats.legend.some': '6–15',
    'stats.legend.many': '16–50',
    'stats.legend.loads': '50+',
    'stats.devices': '{n} 台设备',
    'stats.foot':
      '设备 ID 是应用本地生成的随机字符串，删除应用即消失；可在应用设置中关闭上报。',
    'footer.home': '返回首页',
    'footer.license': 'AGPL-3.0 · 商业授权',
  },
  en: {
    brand: 'Miaomiao Notes',
    'nav.home': 'Home',
    'nav.sibling': 'Miaomiao Notes',
    'stats.title': 'Usage',
    'stats.sub': 'Anonymous launch signals only. No personal data, no IP, no device fingerprint.',
    'stats.total': 'Total users',
    'stats.today': 'Active today',
    'stats.week': 'Active in 7 days',
    'stats.cities': 'Cities',
    'stats.map': 'Worldwide',
    'stats.daily': 'Daily active',
    'stats.empty': 'No data yet',
    'stats.legend': 'Devices',
    'stats.legend.none': 'none',
    'stats.legend.one': '1–2',
    'stats.legend.few': '3–5',
    'stats.legend.some': '6–15',
    'stats.legend.many': '16–50',
    'stats.legend.loads': '50+',
    'stats.devices': '{n} devices',
    'stats.foot':
      'The device id is a random string generated locally; deleting the app removes it. Reporting can be turned off in Settings.',
    'footer.home': 'Back to home',
    'footer.license': 'AGPL-3.0 · Commercial',
  },
};

/* 六档配色，从「无数据」到「最多」 */
const BUCKET_COLORS = ['#f3ecdd', '#ffe3a3', '#ffcf6b', '#ffb020', '#f59a2b', '#e0761f'];

const STORAGE_KEY = 'miaomiao-bar-site.lang';
let currentLang = 'zh';
let statsData = null;
let mapData = null;

function t(key, vars) {
  let text = messages[currentLang][key] ?? messages.zh[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

function applyLanguage(lang) {
  currentLang = messages[lang] ? lang : 'zh';
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';

  for (const node of document.querySelectorAll('[data-i18n]')) {
    const text = messages[currentLang][node.dataset.i18n];
    if (text) node.textContent = text;
  }

  const label = document.getElementById('lang-label');
  if (label) label.textContent = currentLang === 'zh' ? 'EN' : '中文';

  try {
    localStorage.setItem(STORAGE_KEY, currentLang);
  } catch {
    /* ignore */
  }

  renderLegend();
  render();
}

/** 设备数 -> 0..5 档位。 */
function bucketOf(devices) {
  if (!devices) return 0;
  if (devices <= 2) return 1;
  if (devices <= 5) return 2;
  if (devices <= 15) return 3;
  if (devices <= 50) return 4;
  return 5;
}

function render() {
  if (!statsData) return;

  document.getElementById('stat-total').textContent = String(statsData.totalDevices ?? 0);
  document.getElementById('stat-today').textContent = String(statsData.todayDevices ?? 0);
  document.getElementById('stat-week').textContent = String(statsData.weekDevices ?? 0);

  renderMap();
  renderCities(statsData.cities || []);
  renderDaily(statsData.daily || []);
}

function renderLegend() {
  const legend = document.getElementById('map-legend');
  if (!legend) return;

  legend.replaceChildren();
  const labels = [
    t('stats.legend.none'),
    t('stats.legend.one'),
    t('stats.legend.few'),
    t('stats.legend.some'),
    t('stats.legend.many'),
    t('stats.legend.loads'),
  ];

  BUCKET_COLORS.forEach((color, index) => {
    const item = document.createElement('span');
    item.className = 'legend-item';

    const swatch = document.createElement('i');
    swatch.style.background = color;

    const text = document.createElement('em');
    text.textContent = labels[index];

    item.append(swatch, text);
    legend.appendChild(item);
  });
}

/* ---------------------------------------------------------------- map */

function renderMap() {
  const svg = document.getElementById('world-map');
  if (!svg || !mapData) return;

  svg.setAttribute('viewBox', `0 0 ${mapData.width} ${mapData.height}`);
  svg.replaceChildren();

  const counts = new Map();
  for (const item of statsData?.countries || []) counts.set(item.code, item.devices);

  for (const country of mapData.countries) {
    const devices = counts.get(country.code) ?? 0;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', country.d);
    path.setAttribute('data-code', country.code);
    path.setAttribute('data-name', country.name);
    path.setAttribute('data-devices', String(devices));
    path.setAttribute('fill', BUCKET_COLORS[bucketOf(devices)]);
    path.classList.add('country');
    if (devices > 0) path.classList.add('has-data');
    svg.appendChild(path);
  }
}

function cityNamesFor(code) {
  return (statsData?.cities || [])
    .filter((row) => row.country === code)
    .slice(0, 4)
    .map((row) => `${row.city} (${row.devices})`);
}

function bindMapTooltip() {
  const svg = document.getElementById('world-map');
  const tooltip = document.getElementById('map-tooltip');
  if (!svg || !tooltip) return;

  const show = (event) => {
    const target = event.target.closest('.country');
    if (!target) return;

    const name = target.dataset.name;
    const devices = Number(target.dataset.devices || 0);
    const code = target.dataset.code;
    const cities = cityNamesFor(code);

    tooltip.replaceChildren();

    const title = document.createElement('strong');
    title.textContent = name;
    tooltip.appendChild(title);

    const count = document.createElement('span');
    count.textContent = t('stats.devices', { n: devices });
    tooltip.appendChild(count);

    if (cities.length) {
      const detail = document.createElement('em');
      detail.textContent = cities.join(' · ');
      tooltip.appendChild(detail);
    }

    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    tooltip.style.left = `${x}%`;
    tooltip.style.top = `${y}%`;
    tooltip.classList.add('is-visible');
  };

  const hide = () => tooltip.classList.remove('is-visible');

  svg.addEventListener('mousemove', show);
  svg.addEventListener('mouseleave', hide);
}

/* ---------------------------------------------------------------- lists */

function renderCities(cities) {
  const list = document.getElementById('city-list');
  if (!list) return;
  list.replaceChildren();

  if (!cities.length) {
    const empty = document.createElement('li');
    empty.className = 'stats-empty';
    empty.textContent = t('stats.empty');
    list.appendChild(empty);
    return;
  }

  const max = Math.max(...cities.map((row) => row.devices), 1);

  for (const row of cities.slice(0, 10)) {
    const li = document.createElement('li');
    li.className = 'city-row';

    const name = document.createElement('span');
    name.className = 'city-name';
    name.textContent = row.city;

    const bar = document.createElement('span');
    bar.className = 'city-bar';
    const fill = document.createElement('i');
    fill.style.width = `${Math.max(4, Math.round((row.devices / max) * 100))}%`;
    bar.appendChild(fill);

    const count = document.createElement('span');
    count.className = 'city-count';
    count.textContent = String(row.devices);

    li.append(name, bar, count);
    list.appendChild(li);
  }
}

function renderDaily(daily) {
  const chart = document.getElementById('daily-chart');
  if (!chart) return;
  chart.replaceChildren();

  const recent = daily.slice(0, 14).reverse();
  if (!recent.length) {
    const empty = document.createElement('p');
    empty.className = 'stats-empty';
    empty.textContent = t('stats.empty');
    chart.appendChild(empty);
    return;
  }

  const max = Math.max(...recent.map((row) => row.uv), 1);

  for (const row of recent) {
    const col = document.createElement('div');
    col.className = 'day-col';
    col.title = `${row.date}: ${row.uv}`;

    const bar = document.createElement('i');
    const ratio = Math.max(0.04, row.uv / max);
    bar.style.height = `calc((100% - 16px) * ${ratio})`;

    const label = document.createElement('span');
    label.textContent = row.date.slice(5);

    col.append(bar, label);
    chart.appendChild(col);
  }
}

/* ---------------------------------------------------------------- load */

async function loadStats() {
  try {
    const response = await fetch('/api/stats', { headers: { Accept: 'application/json' } });
    const payload = await response.json();
    if (payload.ok) {
      statsData = payload.data;
      render();
    }
  } catch {
    /* leave the placeholders */
  }
}

async function loadMap() {
  try {
    const response = await fetch('/assets/world-map.json');
    mapData = await response.json();
    renderMap();
  } catch {
    /* the map is decorative; the lists still work */
  }
}

function init() {
  let saved = 'zh';
  try {
    saved = localStorage.getItem(STORAGE_KEY) || 'zh';
  } catch {
    /* ignore */
  }

  applyLanguage(saved);
  renderLegend();
  bindMapTooltip();

  document.getElementById('lang-toggle')?.addEventListener('click', () => {
    applyLanguage(currentLang === 'zh' ? 'en' : 'zh');
  });

  loadMap();
  loadStats();
}

init();
