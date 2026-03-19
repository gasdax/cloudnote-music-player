# 🎵 CloudNote Music Player - Vercel 部署指南

## ✅ 已准备就绪
- [x] 代码已修复所有 bug
- [x] 生产构建完成 (`dist/`)
- [x] Vercel 配置文件创建

---

## 🚀 一键部署到 Vercel（5 分钟）

### 方式 1：拖拽部署（最快，无需安装）

1. **访问 Vercel**：https://vercel.com/new
2. **点击"Add New" → "Project"**
3. **直接拖拽 `dist/` 文件夹到上传区域**
4. **点击"Deploy"**
5. **完成！** 获得永久免费域名：`https://your-project.vercel.app`

### 方式 2：GitHub 集成（自动更新）

```bash
# 1. 创建 GitHub 仓库
git init
git add .
git commit -m "feat: music player v1.0 with persistence"

# 2. 在 GitHub.com 创建新仓库，复制远程 URL
git remote add origin https://github.com/你的用户名/music-player.git
git push -u origin master

# 3. Vercel 导入 GitHub 仓库，自动部署
```

---

## 🎯 当前临时访问

**本地预览：** `http://localhost:8080`（仅本机可访问）

服务器已启动，但需要公网 IP 或域名才能外网访问。

---

## 💡 其他部署方案

### Netlify（类似 Vercel）
- https://app.netlify.com/drop
- 拖拽 `dist/` 文件夹即可

### GitHub Pages
```bash
npm install -g gh-pages
# 修改 package.json 添加
"homepage": "https://你的用户名.github.io/music-player"
"scripts": {
  "deploy": "gh-pages -d dist"
}
npm run deploy
```

### Nginx（自有服务器）
```bash
# 如果服务器有 nginx
sudo cp -r /home/underdog/.openclaw/workspace/cloudnote-music-player/dist/* /var/www/html/
sudo systemctl restart nginx
```

---

## 📝 部署后测试清单

- [ ] 打开网址，页面正常加载
- [ ] 点击"选择音乐"可上传文件
- [ ] 上传歌曲后点击暂停/播放正常切换
- [ ] 点击"⚙️ 设置"弹出设置面板
- [ ] 刷新浏览器，播放列表自动恢复

---

**部署完成时间：** < 5 分钟  
**费用：** 永久免费  
**技术支持：** https://vercel.com/docs
