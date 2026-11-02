<div align="center">

<img src="build/icon.png" width="104" alt="喵喵剪贴板" />

# 喵喵剪贴板 · miaomiao-bar

**macOS 上的剪贴板工作台：文字和图片，凡是进了剪贴板的东西，出来的都是能直接用的样子。**

<a href="https://bar.wordtk.com"><img alt="下载" src="https://img.shields.io/badge/%E2%96%B6_%E4%B8%8B%E8%BD%BD-bar.wordtk.com-f2b544?style=for-the-badge"></a>
<img alt="版本" src="https://img.shields.io/badge/%E7%89%88%E6%9C%AC-1.14.1-f2b544?style=for-the-badge">

<br/>

<img alt="平台" src="https://img.shields.io/badge/macOS-13%2B-1f2328?style=flat-square&logo=apple&logoColor=white">
<img alt="electron" src="https://img.shields.io/badge/Electron-45-47848f?style=flat-square&logo=electron&logoColor=white">
<img alt="运行时依赖" src="https://img.shields.io/badge/%E8%BF%90%E8%A1%8C%E6%97%B6%E4%BE%9D%E8%B5%96-0-2f7d52?style=flat-square">
<img alt="历史" src="https://img.shields.io/badge/%E5%8E%86%E5%8F%B2-%E4%BB%85%E6%9C%AC%E5%9C%B0-2f7d52?style=flat-square">
<img alt="动作数" src="https://img.shields.io/badge/%E5%8A%A8%E4%BD%9C-21-f2b544?style=flat-square">
<img alt="协议" src="https://img.shields.io/badge/%E5%8D%8F%E8%AE%AE-AGPL--3.0--only-6b7280?style=flat-square">

<br/><br/>

[🇺🇸 English](README.md) &nbsp;·&nbsp; 🇨🇳 **简体中文**

</div>

> 复制一段乱糟糟的内容，点开菜单栏，选它该变成什么样。喵喵剪贴板直接把剪贴板就地改写，下一次
> **⌘V** 粘出来就是对的：网页样式剥干净的纯文本、中英文之间加好空格、多行清单压成一行、
> 去掉 `utm_source=…` 尾巴的干净链接。
>
> 不需要账号，没有窗口要管，一次网络请求都不发。面板显示的是**当前这块内容能变成什么**，
> 而不是一个固定的大菜单。

---

## 目录

| | |
| --- | --- |
| [它做什么](#它做什么) | [动作清单](#动作清单) |
| [快捷键](#快捷键) | [工作原理](#工作原理) |
| [隐私](#隐私) | [项目结构](#项目结构) |
| [从源码构建](#从源码构建) | [当前进度](#当前进度) |
| [开源协议](#开源协议) | |

---

## 安装

到 **[bar.wordtk.com](https://bar.wordtk.com)** 下载 dmg（Apple Silicon 与 Intel 各一个），拖进
`Applications` 打开即可。安装包是 ad-hoc 签名、没做公证，所以第一次打开需要在「系统设置 → 隐私与安全性」点「仍要打开」（macOS 14 及更早可右键图标 → 打开）。

文字动作开箱即用；图片上传需要先在「设置 → 存储」里加一个存储桶，官网的
[图片上传一节](https://bar.wordtk.com/#bucket)写清了四个关键字段。

## 界面

<p align="center">
  <img src="docs/screenshots/panel-main.png" width="240" alt="面板：剪贴板能变成什么" />
  <img src="docs/screenshots/panel-history.png" width="240" alt="历史记录" />
  <img src="docs/screenshots/panel-settings.png" width="240" alt="设置" />
</p>

深色模式在顶栏切换，选择会记住；系统换外观时不会把你脚下的地板抽走。

<p align="center">
  <img src="docs/screenshots/panel-main-dark.png" width="240" alt="深色模式的面板" />
  <img src="docs/screenshots/panel-history-dark.png" width="240" alt="深色模式的历史记录" />
  <img src="docs/screenshots/panel-settings-dark.png" width="240" alt="深色模式的设置" />
</p>

## 它做什么

一个模型、一件事：**剪贴板进 → 变换 → 剪贴板出**。

- **图片只有三个按钮。** 复制到剪贴板、用「预览」打开慢慢改、或者传到自己的图床 / 存到下载目录。
- **两套外观，不做自动适配。** 深色是深夜里的喵喵剪贴板（炭黑 + 琥珀），浅色是白天模式的喵喵剪贴板（奶油纸 + 焦糖墨）。
  切换按钮在顶栏，选择会记住——系统换外观时不会把你脚下的地板抽走。
- **是菜单栏面板，不是窗口。** 点图标、选动作、去粘贴。没有 Dock 图标，也不占桌面。
- **只显示用得上的动作。** 列表按剪贴板当下真实内容过滤：「转纯文本」只对富文本出现，中文排版组只在中英文相邻时出现，净化链接只对带跟踪参数的链接出现。
- **直接在面板里改剪贴板。** 文字预览上点「编辑」，手动改完保存就覆盖剪贴板——不用另开一个 App 当中转站。
- **中文排版做对了。** 中英文之间自动加空格、标点按语境转全角或半角——这两件是每个中文写作者天天手动改的事。
- **撤销就在动作列表右上角。** 执行过动作后，「能做什么」右侧会出现一个撤销按钮，点一下回到上一步；键盘党仍可用 ⌥⌘Z。
- **图片进你自己的桶。** 点一下就传到 Cloudflare R2 / 腾讯 COS / 阿里 OSS / MinIO，链接按
  URL、Markdown、HTML 或 BBCode 写回剪贴板。
- **运行时零依赖。** 除 Electron 本体外没有 npm 依赖；签名、存储和每个变换都是手写的。

**它不是给程序员的**：这里没有 Base64 编码器、没有正则调试台、没有时间戳转换器。那些是开发者工具，而这个应用刻意属于所有会复制文字的人——写作者、运营、半夜整理名单的你。格式化 JS/CSS/HTML 也不做：那要引 formatter 依赖，正是这个项目拒绝的重量。

## 动作清单

每个动作都是纯函数，由注册表决定当前该列出哪些。清单刻意保持克制：只收文字工作者真正会用到的，不收“技术上做得到”的。

**富文本 ⇄ Markdown 双向可转。** 从浏览器复制的文章一键变干净 Markdown；写好 Markdown 又能转成富文本放回剪贴板——粘进 Word、微信、邮件都保留格式，粘进代码编辑器仍然是 Markdown 源码。

| 分组 | 动作 |
| --- | --- |
| 转换 | 编辑文字 · **复制到剪贴板** · 转纯文本 · **转 Markdown** · **转富文本** |
| 清理 | 去首尾空白 · 合并空行 · 压成一行 · 去掉行号 · 清除隐形字符 · 去掉 Markdown 标记 |
| 排版 | 中英文之间加空格 · 标点转全角 |
| 列表 | 去重行 · 排序行 |
| 链接 | 净化链接 · 提取文中所有链接 |
| 图片 | 预览打开图片 · 复制到剪贴板 · 上传到图床 · 存到下载目录 |

加一个工具就是在 `electron/actions/` 下加一个文件——面板、测试和 IPC 都会自动接上。

## 图片上传

在**设置 → 存储**里加一个存储桶，之后剪贴板里有图片时，图片动作就会出现。

| 字段 | 填什么 |
| --- | --- |
| Endpoint | R2 填 `https://<account-id>.r2.cloudflarestorage.com`，COS 填 `https://cos.<region>.myqcloud.com`，OSS 填 `https://oss-<region>.aliyuncs.com` |
| Region | R2 填 `auto`，COS/OSS 填真实地域 |
| 桶名 | 你的桶 |
| 公开域名 | 图片对外提供服务的域名——回给你的链接就用它 |
| Access Key / Secret | 有写权限的 S3 密钥；Secret 用 macOS 钥匙串加密 |
| 路径风格 | MinIO 与自建一般要开，虚拟主机风格要关 |

对象名按内容寻址（`images/2026/10/4f9c1a2b.png`），同一张图传两次只会有一个对象。
链接格式（URL / Markdown / HTML / BBCode）是设置项，不是每次上传都问。

## 图片

截图交给 macOS：`⌘⇧⌃4` 框选后直接进剪贴板，面板会自动识别。之后图片只有三个动作——复制到剪贴板、
预览打开图片、上传到图床或存到下载目录。应用本身不提供截图快捷键，所以不需要「屏幕录制」权限，
也不会在后台抓屏。

## 剪贴板历史

面板底部那一行保留最近 3 条，点「全部」看完整列表。

- 文字与图片都记，最新在前，用首字或缩略图当预览
- 点任意一条即可回填到剪贴板
- 鼠标移到某条上，右侧浮出删除按钮，可单独删掉这一条（图片会连缩略图一起清掉）
- 默认上限 100 条 / 200 MB（设置里可选 50 / 100 / 200），超出先丢最旧的
- 重复复制的内容会移到最前，而不是堆一堆副本
- 只记你复制过的东西，一个字节都不上传
- 随时可在设置里关掉记录

## 快捷键

| 按键 | 动作 |
| --- | --- |
| `⌥⌘V` | 显示 / 收起面板 |
| `⌥⌘Z` | 撤销上一个动作 |
| `Esc` | 收起面板 |

面板是鼠标优先的：没有方向键光标、没有回车执行，点哪一行就执行哪一行。

## 工作原理

```
electron/actions/   每个分组一个文件，全是纯函数
electron/clipboard.cjs
                    针对 Electron 44+ 异步剪贴板 API 的读写层
electron/main.cjs   菜单栏图标、面板窗口、快捷键、IPC
src/                面板渲染层：预览、动作网格、双语文案
```

三条规矩让它不跑偏：

1. **动作永远不碰 Electron。** 输入 `{ kind, text, html }`，输出 `{ text }` 或 `{ error }`，
   所以整套动作能用 `node:test` 零依赖覆盖。
2. **剪贴板只有主进程能碰。** 渲染层只能拿到预览和动作清单。
3. **写回剪贴板就是流程终点。** 没有抽屉、没有落地文件——结果就在剪贴板上，直接粘。

## 隐私

- 面板显示时会读剪贴板；为了攒历史，后台也会轮询——文字每 1.2 秒、图片每 3 秒。
- 历史从不离开这台 Mac：它是 `~/Library/Application Support/喵喵剪贴板/` 下的一个索引加若干图片文件。
- 只有两类网络请求，都写在这里：一是 `PUT` 到你配置的存储桶；二是每次启动一条匿名信号（本机生成的随机
  设备 ID、UTC 日期，以及 Cloudflare 解析出的国家/城市级定位），用于[使用数据页](https://bar.wordtk.com/stats)。
  在设置里关掉「匿名使用统计」即刻停止。不上传内容、不存 IP、不存 UA、没有崩溃上报；检查更新只是一次
  公开清单的 GET。那条 GET 用 15 秒超时 + 一次重试：慢速双栈网络里 IPv6 的 AAAA 记录常常黑洞，
  浏览器靠 Happy Eyeballs 会立刻回落 IPv4，而请求挂住时会看起来像「检查更新坏了」。
  失败时面板会写清原因（没配置官网 / 网络不可达 / 服务器异常），不再一律「检查失败」。
- 关掉记录会立刻停止写入；「清空历史」会把索引和所有图片一起删掉。
- 应用自身不截屏，也从不申请「屏幕录制」权限。

## 项目结构

```
electron/           主进程：菜单栏图标、面板窗口、剪贴板、IPC
electron/actions/   动作注册表与各分组
electron/sigv4.cjs
                    AWS Signature V4 + S3 PUT，对照 AWS 官方测试向量验证
electron/storage.cjs
                    存储桶配置；密钥用钥匙串加密
electron/history.cjs
                    历史索引 + 图片文件，不依赖 Electron、有单元测试
electron/watcher.cjs
                    剪贴板轮询器（macOS 没有剪贴板变更事件）
electron/settings.cjs
                    持久化的开关与上限
src/                渲染层：面板结构、样式、双语文案、DOM 逻辑
src/styles/         一套深色玻璃主题，不引 CSS 框架
build/              图标母版（PNG）与生成的 icns
scripts/            afterPack 钩子，负责 ad-hoc 签名
tests/              动作的 node:test 测试
```

渲染层碰不到 Node：所有能力都收在一个很窄的 `contextBridge` 里，
`contextIsolation` 与 `sandbox` 都是开启的。

## 从源码构建

```bash
npm install
npm run dev            # Vite + Electron，带热更新
npm test               # 102 个单元测试，零依赖
npm run dist:arm64     # Apple Silicon 的 dmg，产物在 release/
npm run dist:x64       # Intel 的 dmg（会先补齐 x64 原生模块）
```

应用已不再携带原生模块，两个架构都是纯 Electron 构建

在仓库根目录放一个 `.env`（已被 git 忽略）写入 `VITE_SITE_URL=https://你的域名`，`npm run dist`
会把它打进包里；设置页的 **官网** 按钮、菜单栏的「官网」项、检查更新和匿名启动统计都读它。
域名不进仓库；没配时这些功能自动关闭，按钮退回 GitHub 仓库首页。

同一个 `.env` 里可再写 `CONTACT_EMAIL=你的邮箱`（可选）：它填进关于面板的邮箱项，
不配置时该项自动隐藏。

官网在 `site/`，作为独立的 Cloudflare Worker 部署（进去跑 `npm run deploy`）。它和
sendtk、codetk、miaomiao-notes 共用**同一个 `common` D1 库**（免费额度只给 10 个库），
所以表名是 `bar_launches`、索引带 `bar_` 前缀。建表用
`npx wrangler d1 migrations apply common --remote`；`d1_migrations` 是按文件名记账的
全库共享台账，因此 `site/migrations/` 里的文件名要带项目名（`0001_bar_init.sql`）。

## 生成物

仓库里的图片都不手改，每一张都有生成脚本：

```bash
bash tools/build-icons.sh                              # icon.icns、站点图标、favicon、apple-touch-icon、托盘图
npm run build && npx electron tools/shoot-panels.cjs   # 面板截图（亮色）
SHOOT_THEME=dark npx electron tools/shoot-panels.cjs   # 面板截图（暗色）
npx electron tools/make-og.cjs                         # 1200×630 分享卡片
```

真正要手改的只有两张母版：`build/icon-source.png` 与 `build/icon-favicon.png`；
底板几何、为什么 16/32px 用头部特写，都写在 `tools/build-icons.sh` 的注释里。

## 发布新版本

```bash
npm run build && npm run dist     # 两个架构的 dmg 都进 release/
cd site && npm run release        # 上传 R2、重写清单、清理上一版
```

`site/scripts/publish-release.mjs` 会把 `release/*.dmg` 以 `miaomiao-bar/` 前缀传到共用的
`common` 桶，重写 `site/latest.json`（Worker 读的清单），然后删除上一版清单指向的两个安装包，
让桶里只留当前版本。上线依然只走 `git push`，由 Cloudflare Workers Builds 部署站点。

## 当前进度

`1.14.1`：21 个动作、六个分组、图片上传到你自己的 S3 兼容存储桶、存到下载目录与「预览」、
本地剪贴板历史（文字 + 图片）、动作旁的撤销按钮、检查更新、匿名使用数据页，以及双语面板。
官网在 **https://bar.wordtk.com**，双架构 dmg 由 Cloudflare R2 分发。

## 开源协议

双轨授权：

- **开源** —— [AGPL-3.0-only](LICENSE)。可自由使用、修改、自部署；如果你分发修改后的版本，
  AGPL 要求你一并公开对应源码。
- **商业** —— 如果 AGPL 不适合你的产品（例如要发布闭源衍生品），
  见 [LICENSE-COMMERCIAL.md](LICENSE-COMMERCIAL.md)。

「喵喵剪贴板 / miaomiao-bar」这个名字与图标不在开源授权范围内。
