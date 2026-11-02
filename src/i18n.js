/**
 * Bilingual copy for the panel.
 *
 * Action names are not here: each action carries its own `title: { zh, en }`
 * so that adding a tool stays a one-file change.
 */

const STORAGE_KEY = 'miaomiao-bar.lang';

const dict = {
  zh: {
    brand: '喵喵剪贴板',
    'action.theme': '切换外观',
    'settings.quit': '退出喵喵剪贴板',
    'action.close': '关闭面板',
    'settings.telemetry': '匿名使用统计',
    'settings.telemetryHint': '只上报随机设备 ID 与地区，用来知道有多少人在用',
    'settings.update': '检查更新',
    'settings.updateHint': '每天自动检查一次，也可以现在就看',
    'settings.updateAction': '立即检查',
    'settings.updateChecking': '正在检查…',
    'settings.updateLatest': '已是最新版本 v{v}',
    'settings.updateNewer': '有新版本 v{v}，去官网下载',
    'settings.updateFailed': '检查失败，稍后再试',
    'settings.updateNoSite': '本构建未写入官网地址，无法检查更新',
    'settings.updateOffline': '连不上官网，请检查网络或代理',
    'settings.updateServer': '服务器返回异常（HTTP {status}）',
    'update.available': '有新版本 v{v}，在设置里可以检查',
    'open.done': '已在预览中打开',
    'err.open_failed': '打不开这张图片',
    'restore.done': '已复制到剪贴板',
    'edit.save': '保存',
    'edit.cancel': '取消',
    'edit.hint': '改完保存即可覆盖剪贴板',
    'edit.saved': '已覆盖剪贴板',
    'action.lang': '切换语言',
    'action.settings': '设置',
    'clip.title': '剪贴板',
    'clip.imageMeta': '{w} × {h}',
    'clip.textMeta': '{n} 字',
    'clip.rich': '富文本',
    'clip.emptyTitle': '剪贴板是空的',
    'clip.emptyDesc': '复制一段文字或一张图片，这里会列出能对它做什么',
    'actions.title': '能做什么',
    'actions.count': '{n} 个动作',
    'actions.imageEmpty': '图片动作还在开发中：上传到图床、存到下载目录',
    'history.strip': '最近',
    'history.all': '全部',
    'history.empty': '还没有历史，复制点东西就会开始记录',
    'history.clear': '清空历史',
    'history.clearConfirm': '再点一次确认',
    'history.delete': '删除这条记录',
    'history.deleted': '已删除',
    'history.restored': '已复制到剪贴板',
    'history.stats': '{n} 条 · {size}',
    'history.image': '图片 {w}×{h}',
    'history.imagePlain': '图片',
    'history.disabled': '历史记录已关闭',
    'settings.title': '设置',
    'settings.history': '记录剪贴板历史',
    'settings.historyHint': '关掉后不再记录新内容',
    'settings.maxItems': '最多保留',
    'settings.launch': '开机启动',
    'settings.launchHint': '登录后自动常驻菜单栏',
    'settings.github': 'GitHub 仓库',
    'donate.title': '请我喝杯咖啡',
    'donate.sub': '你的支持让喵喵剪贴板继续更新',
    'settings.website': '官网',
    'age.now': '刚刚',
    'age.minutes': '{n} 分钟前',
    'age.hours': '{n} 小时前',
    'age.days': '{n} 天前',
    'err.not_found': '这条记录已经不在了',
    'err.invalid_input': '输入不合法',
    'settings.storage': '存储',
    'settings.addBucket': '添加存储桶',
    'settings.linkFormat': '复制格式',
    'settings.linkFormatHint': '上传后写回剪贴板的格式',
    'bucket.title': '存储桶',
    'bucket.name': '名称',
    'bucket.endpoint': 'Endpoint',
    'bucket.region': 'Region',
    'bucket.bucket': '桶名',
    'bucket.publicBase': '公开域名',
    'bucket.secretHint': '留空则保留已保存的密钥',
    'bucket.pathStyle': '路径风格寻址',
    'bucket.pathStyleHint': 'endpoint/桶名/文件名，MinIO 与自建常用',
    'bucket.save': '保存',
    'bucket.delete': '删除',
    'bucket.edit': '编辑',
    'bucket.saved': '已保存',
    'bucket.deleted': '已删除',
    'bucket.empty': '还没有存储桶，图片上传会一直隐藏',
    'group.image': '图片',
    'upload.done': '已上传，链接已复制',
    'convert.richDone': '已转为富文本，可直接粘贴',
    'save.done': '已保存到下载目录',
    'err.invalid_endpoint': 'Endpoint 不是合法 URL',
    'err.insecure_endpoint': 'Endpoint 必须是 https',
    'err.missing_bucket': '请填写桶名',
    'err.missing_access_key': '请填写 Access Key',
    'err.missing_secret': '请填写 Secret Key',
    'err.encryption_unavailable': '钥匙串不可用，无法安全保存密钥',
    'err.upload_failed': '上传失败，检查 endpoint、密钥与桶权限',
    'err.no_bucket': '还没有配置存储桶',
    'err.save_failed': '保存图片失败',
    'group.convert': '转换',
    'group.clean': '清理',
    'group.typography': '排版',
    'group.list': '列表',
    'group.link': '链接',
    'status.empty': '等待剪贴板内容',
    'status.ready': '就绪',
    'status.running': '处理中…',
    'status.done': '已写入剪贴板',
    'status.undone': '已撤销',
    undo: '撤销',
    'action.undo': '撤销上一步（⌥⌘Z）',
    'err.empty_result': '结果为空，没有改动',
    'err.unchanged': '内容没有变化',
    'err.invalid_json': '这段内容不是合法 JSON',
    'err.invalid_base64': '不是合法的 Base64',
    'err.invalid_url_encoding': '百分号编码不完整',
    'err.invalid_timestamp': '时间戳超出范围',
    'err.invalid_date': '识别不出日期',
    'err.not_applicable': '当前剪贴板类型不支持这个动作',
    'err.unknown_action': '动作不存在',
    'err.nothing_to_undo': '没有可撤销的操作',
    'err.no_links': '这段内容里没有链接',
    'toast.settings': '设置面板正在开发中',
  },
  en: {
    brand: 'Miaomiao Bar',
    'action.theme': 'Switch appearance',
    'settings.quit': 'Quit Miaomiao Bar',
    'action.close': 'Close panel',
    'settings.telemetry': 'Anonymous usage',
    'settings.telemetryHint': 'A random device id and coarse region only — how many people use it',
    'settings.update': 'Check for updates',
    'settings.updateHint': 'Checked once a day, or right now',
    'settings.updateAction': 'Check now',
    'settings.updateChecking': 'Checking…',
    'settings.updateLatest': 'Up to date — v{v}',
    'settings.updateNewer': 'v{v} is out — get it from the site',
    'settings.updateFailed': 'Could not check, try again later',
    'settings.updateNoSite': 'This build has no site address, so updates cannot be checked',
    'settings.updateOffline': 'Cannot reach the site — check your network or proxy',
    'settings.updateServer': 'The server answered with an error (HTTP {status})',
    'update.available': 'v{v} is available — see settings',
    'open.done': 'Opened in Preview',
    'err.open_failed': 'Could not open that image',
    'restore.done': 'Copied to the clipboard',
    'edit.save': 'Save',
    'edit.cancel': 'Cancel',
    'edit.hint': 'Edit, then save to overwrite the clipboard',
    'edit.saved': 'Clipboard overwritten',
    'action.lang': 'Switch language',
    'action.settings': 'Settings',
    'clip.title': 'Clipboard',
    'clip.imageMeta': '{w} × {h}',
    'clip.textMeta': '{n} chars',
    'clip.rich': 'rich text',
    'clip.emptyTitle': 'The clipboard is empty',
    'clip.emptyDesc': 'Copy some text or an image and this panel lists what it can become',
    'actions.title': 'Can become',
    'actions.count': '{n} actions',
    'actions.imageEmpty': 'Image actions are coming: upload to your bucket, save to Downloads',
    'history.strip': 'Recent',
    'history.all': 'All',
    'history.empty': 'Nothing yet — copy something and this fills up',
    'history.clear': 'Clear history',
    'history.clearConfirm': 'Click again to confirm',
    'history.delete': 'Delete this entry',
    'history.deleted': 'Deleted',
    'history.restored': 'Copied to the clipboard',
    'history.stats': '{n} items · {size}',
    'history.image': 'Image {w}×{h}',
    'history.imagePlain': 'Image',
    'history.disabled': 'History is off',
    'settings.title': 'Settings',
    'settings.history': 'Record clipboard history',
    'settings.historyHint': 'Turn off to stop recording new items',
    'settings.maxItems': 'Keep at most',
    'settings.launch': 'Launch at login',
    'settings.launchHint': 'Stay in the menu bar after login',
    'settings.github': 'GitHub repository',
    'donate.title': 'Buy me a coffee',
    'donate.sub': 'Your support keeps Miaomiao Bar going',
    'settings.website': 'Website',
    'age.now': 'just now',
    'age.minutes': '{n} min ago',
    'age.hours': '{n} h ago',
    'age.days': '{n} d ago',
    'err.not_found': 'That item is gone',
    'err.invalid_input': 'Invalid input',
    'settings.storage': 'Storage',
    'settings.addBucket': 'Add bucket',
    'settings.linkFormat': 'Link format',
    'settings.linkFormatHint': 'What an upload writes to the clipboard',
    'bucket.title': 'Bucket',
    'bucket.name': 'Name',
    'bucket.endpoint': 'Endpoint',
    'bucket.region': 'Region',
    'bucket.bucket': 'Bucket name',
    'bucket.publicBase': 'Public domain',
    'bucket.secretHint': 'Leave blank to keep the saved secret',
    'bucket.pathStyle': 'Path-style addressing',
    'bucket.pathStyleHint': 'endpoint/bucket/key — usual for MinIO and self-hosted',
    'bucket.save': 'Save',
    'bucket.delete': 'Delete',
    'bucket.edit': 'Edit',
    'bucket.saved': 'Saved',
    'bucket.deleted': 'Deleted',
    'bucket.empty': 'No bucket yet — image upload stays hidden',
    'group.image': 'Image',
    'upload.done': 'Uploaded, link copied',
    'convert.richDone': 'Rich text ready to paste',
    'save.done': 'Saved to Downloads',
    'err.invalid_endpoint': 'That endpoint is not a valid URL',
    'err.insecure_endpoint': 'The endpoint must be https',
    'err.missing_bucket': 'Bucket name is required',
    'err.missing_access_key': 'Access key is required',
    'err.missing_secret': 'Secret key is required',
    'err.encryption_unavailable': 'Keychain unavailable — cannot store the secret safely',
    'err.upload_failed': 'Upload failed — check endpoint, keys and bucket permissions',
    'err.no_bucket': 'No bucket configured yet',
    'err.save_failed': 'Could not save the image',
    'group.convert': 'Convert',
    'group.clean': 'Text cleanup',
    'group.typography': 'Typography',
    'group.list': 'Lists',
    'group.link': 'Links',
    'status.empty': 'Waiting for the clipboard',
    'status.ready': 'Ready',
    'status.running': 'Working…',
    'status.done': 'Written to the clipboard',
    'status.undone': 'Undone',
    undo: 'Undo',
    'action.undo': 'Undo the last action (⌥⌘Z)',
    'err.empty_result': 'Nothing left after processing',
    'err.unchanged': 'Nothing would change',
    'err.invalid_json': 'That is not valid JSON',
    'err.invalid_base64': 'That is not valid Base64',
    'err.invalid_url_encoding': 'Incomplete percent-encoding',
    'err.invalid_timestamp': 'Timestamp out of range',
    'err.invalid_date': 'That does not read as a date',
    'err.not_applicable': 'This action does not fit the clipboard',
    'err.unknown_action': 'No such action',
    'err.nothing_to_undo': 'Nothing to undo',
    'err.no_links': 'No links in there',
    'toast.settings': 'Settings is coming soon',
  },
};

let lang = 'zh';

function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.hasOwn(vars, key) ? String(vars[key]) : match,
  );
}

export function t(key, vars) {
  const table = dict[lang] ?? dict.zh;
  return interpolate(table[key] ?? dict.zh[key] ?? key, vars);
}

/** Pick the bilingual field an action carries. */
export function pickLocalised(title) {
  if (!title) return '';
  return title[lang] ?? title.zh ?? title.en ?? '';
}

export function getLang() {
  return lang;
}

export function nextLang() {
  return lang === 'zh' ? 'en' : 'zh';
}

/** Translate every element that declared a `data-i18n*` attribute. */
export function applyStatic() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

  for (const node of document.querySelectorAll('[data-i18n]')) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll('[data-i18n-title]')) {
    node.title = t(node.dataset.i18nTitle);
  }
}

export function setLang(next) {
  lang = next === 'en' ? 'en' : 'zh';
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* localStorage can be unavailable on file:// in some builds; ignore. */
  }
  applyStatic();
}

export function storedLang() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
