# 🛠️ CloudNote Music Player - 运维部署手册

---

## 📋 文档信息

| 项目 | 内容 |
|--|--|
| **部署版本** | v1.0.0 (Beta) |
| **适用环境** | Vercel / Netlify / Nginx / Docker |
| **最后更新** | 2026-03-15 |

---

## 🚀 快速部署（推荐）

### 方案 A：Vercel 一键部署（最简单 ⭐⭐⭐⭐⭐）

**适用场景：** 个人项目、快速上线、自动 HTTPS

#### 方式 1：拖拽部署（无需代码托管）

```bash
# 1. 确保已构建生产版本
cd /home/underdog/.openclaw/workspace/cloudnote-music-player
npm run build

# 2. 访问 https://vercel.com/new

# 3. 直接拖拽 dist/ 文件夹到上传区域

# 4. 点击 Deploy → 完成！
```

**获取域名：** `https://your-project.vercel.app`（自动 HTTPS）

#### 方式 2：GitHub 集成（自动更新）

```bash
# 1. 初始化 Git 仓库（如果还没有）
git init
git add .
git commit -m "feat: v1.0.0 with bug fixes"

# 2. 在 GitHub.com 创建新仓库，推送代码
git remote add origin https://github.com/username/music-player.git
git push -u origin master

# 3. Vercel 导入 GitHub 仓库
#    → 自动部署 + 后续提交自动更新
```

---

### 方案 B：Netlify 部署（类似 Vercel）

**适用场景：** 备选平台、需要更多自定义配置

#### 拖拽部署

```bash
# 1. 构建项目
npm run build

# 2. 访问 https://app.netlify.com/drop

# 3. 拖拽 dist/ 文件夹

# 4. 获取域名：https://random-name.netlify.app
```

#### Git 集成（推荐）

1. 在 Netlify.com 创建账号
2. "New site from Git" → 选择 GitHub 仓库
3. 配置构建命令：
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. 点击 Deploy

---

## 🖥️ 传统服务器部署

### 方案 C：Nginx 静态托管（自有 Linux 服务器）

**适用场景：** 有独立服务器、需要完全控制

#### 1. 上传构建产物到服务器

```bash
# 本地打包
cd /home/underdog/.openclaw/workspace/cloudnote-music-player
npm run build

# 上传到服务器（示例：使用 scp）
scp -r dist/* user@server:/var/www/music-player/
```

#### 2. 配置 Nginx

```nginx
# /etc/nginx/sites-available/music-player
server {
    listen 80;
    server_name your-domain.com;  # 或 IP 地址
    
    root /var/www/music-player;
    index index.html;
    
    # SPA 路由支持（Vite 前端路由）
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 3. 启用配置并重启

```bash
sudo ln -s /etc/nginx/sites-available/music-player /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl restart nginx
```

#### 4. （可选）配置 HTTPS（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期（Certbot 会自动配置 cron）
sudo certbot renew --dry-run
```

---

### 方案 D：Docker 容器部署

**适用场景：** 需要隔离环境、易于迁移

#### 1. 创建 Dockerfile

```dockerfile
# /home/underdog/.openclaw/workspace/cloudnote-music-player/Dockerfile

# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2. 创建 nginx.conf

```nginx
# nginx.conf (同方案 C，放在 Dockerfile 中)
srv {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 3. 构建并运行容器

```bash
# 构建镜像
docker build -t cloudnote-music-player .

# 运行容器（映射端口）
docker run -d -p 8080:80 --name music-player cloudnote-music-player
```

**访问地址：** `http://your-server-ip:8080`

---

### 方案 E：GitHub Pages（免费静态托管）

**适用场景：** GitHub 仓库、简单部署

#### 1. 安装 gh-pages 插件

```bash
npm install -D gh-pages
```

#### 2. 修改 package.json

```json
{
  "homepage": "https://username.github.io/music-player",
  "scripts": {
    "deploy": "gh-pages -d dist"
  }
}
```

#### 3. 推送部署

```bash
npm run deploy
```

**访问地址：** `https://username.github.io/music-player`

---

## 🧪 部署后验证清单

### 功能验证

- [ ] **页面加载：** 打开网址，无 404/502 错误
- [ ] **选择音乐：** 点击按钮弹出文件对话框
- [ ] **播放控制：** 暂停/播放/上一首/下一首正常
- [ ] **设置面板：** 点击右上角齿轮可打开设置
- [ ] **持久化测试：**
  - 上传 3 首歌曲
  - **刷新浏览器** (F5)
  - ✅ 列表自动恢复，歌曲可播放

### 性能验证

```bash
# 使用 Lighthouse（Chrome DevTools）
1. F12 → Lighthouse 标签页
2. 勾选 Performance, Accessibility, Best Practices, SEO
3. 点击"Analyze page load"
4. 检查分数 >90 为优秀
```

**关键指标：**
- **FCP (First Contentful Paint):** <1.8s
- **LCP (Largest Contentful Paint):** <2.5s
- **TTFB (Time to First Byte):** <600ms

### 安全验证

- [ ] HTTPS 证书有效（Vercel/Netlify 自动）
- [ ] CORS 策略正常（如有 API 调用）
- [ ] CSP 头部已配置（可选，增强防护）

---

## 🔧 运维监控

### 1. Vercel/Netlify 自带监控

**Vercel：**
- 访问 https://vercel.com/dashboard
- 查看实时请求、错误日志、带宽统计

**Netlify：**
- 访问项目 Dashboard → "Analytics"
- 查看访问来源、设备类型、地域分布

### 2. Nginx 自建监控

```bash
# 查看访问日志
tail -f /var/log/nginx/access.log

# 统计热门页面
cat /var/log/nginx/access.log | awk '{print $7}' | sort | uniq -c | sort -nr | head -20

# 检查错误日志
grep "error" /var/log/nginx/error.log | tail -50
```

### 3. 性能监控（可选）

集成 **Google Analytics** 或 **Plausible**（隐私友好）：

```html
<!-- 在 index.html 中的<head> 标签添加 -->
<script defer src="https://plausible.io/js/plausible.js" data-domain="your-domain.com"></script>
```

---

## 🔄 更新部署流程

### Vercel/Netlify（自动）

```bash
# 只需推送到 GitHub，自动触发重新构建
git add .
git commit -m "fix: update settings panel"
git push origin master
```

### Nginx 手动更新

```bash
# 1. 备份当前版本
cp -r /var/www/music-player /var/www/music-player-backup-$(date +%Y%m%d)

# 2. 上传新版本到临时目录
scp dist/* user@server:/tmp/music-player-update/

# 3. 停止 Nginx（可选，无缝更新可不关闭）
sudo systemctl stop nginx

# 4. 替换文件
sudo cp -r /tmp/music-player-update/* /var/www/music-player/

# 5. 重启 Nginx
sudo systemctl start nginx
```

### Docker 更新

```bash
# 1. 构建新镜像
docker build -t cloudnote-music-player:latest .

# 2. 停止旧容器
docker stop music-player
docker rm music-player

# 3. 启动新容器
docker run -d -p 8080:80 --name music-player cloudnote-music-player:latest
```

---

## 🐛 常见问题排查

### Q1: 刷新页面后出现 404

**原因：** 前端路由未配置 SPA fallback

**解决：** Nginx 添加 `try_files $uri $uri/ /index.html;`

---

### Q2: localStorage 容量不足

**症状：** 上传大文件时报 "QuotaExceededError"

**日志：**
```
[PersistStore] ❌ localStorage 空间不足，尝试清理...
```

**解决：**
1. **短期方案：** 减少 Base64 保存的文件大小限制（修改 `persist.ts` 中的 `MAX_PLAYLIST_SIZE`）
2. **长期方案：** 迁移到 IndexedDB（支持几十 MB）

---

### Q3: 暂停按钮无响应（Bug 已修复）

**验证步骤：**
1. 打开浏览器 DevTools (F12)
2. Console 标签页查看日志：`[AudioService] ⏸️ 已暂停`
3. 如有错误，检查 `audio.ts` 中的事件绑定

**历史修复记录：** 见 `docs/PROJECT-MANAGEMENT.md` 中 BUG-001~BUG-004

---

### Q4: Vercel 部署后页面空白

**可能原因：**
1. **构建路径错误** — 检查 `vercel.json` 是否正确
2. **资源未压缩** — Nginx Gzip 配置缺失
3. **CORS 问题** — 如有外部 API，需设置 Origin

**调试方法：**
- Vercel Dashboard → "Deployments" → 点击具体 deployment → "Logs"
- 查看构建日志是否有错误

---

## 📞 技术支持

| 问题类型 | 联系方式 |
|--|--|
| **部署问题** | 文档已覆盖，请查阅对应章节 |
| **Bug 报告** | GitHub Issues / OpenClaw 项目经理 |
| **紧急故障** | @OpenClaw（在线响应） |

---

## 📚 参考资源

- [Vercel 官方文档](https://vercel.com/docs)
- [Netlify 部署指南](https://docs.netlify.com/)
- [Nginx 最佳实践](https://www.nginx.com/resources/wiki/start/)
- [Docker 入门教程](https://docs.docker.com/get-started/)

---

**文档版本：** v1.0  
**编写人：** OpenClaw 项目经理智能体 📊  
**最后更新：** 2026-03-15
