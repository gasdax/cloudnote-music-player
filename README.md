# CloudNote Music Player

一个基于 **Vue 3 + Vite + TypeScript** 的本地音乐播放器项目，并在推进 **Tauri v2** 桌面端打包。

## Screenshots / 截图

将截图放到 `docs/screenshots/`，然后在此处引用（建议至少 2 张：主界面、资料库/队列）。

Example:

- `docs/screenshots/home.png`
- `docs/screenshots/library.png`

（你把图片放好后，我也可以帮你把这里的图片链接补上。）

## 中文介绍

### 亮点

- **现代播放器界面**：侧边栏 + 列表区 + Now Playing 面板，深色玻璃拟态风格
- **队列体验**：搜索、移除、清空、定位当前播放
- **导入方式**：点击导入 / **拖拽文件导入**
- **收藏与最近播放**：支持持久化保存
- **快捷键**
  - `Space`：播放/暂停
  - `←/→`：快退/快进 5 秒
  - `Ctrl+←/→`：上一首/下一首

### 运行

要求：**Node.js 20.19+（推荐 Node 22 LTS）**

```bash
npm install
npm run dev
```

打开 `http://localhost:5173/`。

## English

CloudNote Music Player is a local music player built with **Vue 3 + Vite + TypeScript**, with an ongoing migration towards a **Tauri v2** desktop app.

### Features

- **Modern player layout**: sidebar + list view + Now Playing panel (dark glassmorphism)
- **Queue UX**: search, remove, clear, locate current track
- **Import**: file picker + **drag & drop**
- **Favorites & Recents**: persisted locally
- **Keyboard shortcuts**
  - `Space`: Play/Pause
  - `←/→`: Seek -5s / +5s
  - `Ctrl+←/→`: Previous / Next

### Run

Requires: **Node.js 20.19+ (Node 22 LTS recommended)**

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`.
