# Ronnie Portfolio 项目文档

> 最后更新: 2026-09-02  
> 作者: Ronnie Bach

---

## 📋 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [功能模块](#4-功能模块)
5. [API 接口文档](#5-api-接口文档)
6. [数据库设计](#6-数据库设计)
7. [部署架构](#7-部署架构)
8. [运维指南](#8-运维指南)
9. [安全风险](#9-安全风险)
10. [常见问题](#10-常见问题)

---

## 1. 项目概述

### 1.1 项目简介

Ronnie Portfolio 是一个个人全栈 Web 应用项目，包含以下功能：

- 个人主页 & 简历展示
- 技术博客发布系统
- 德语学习辅助工具
- 点餐系统（带邮件通知）
- 数据统计报表
- 管理后台

### 1.2 项目信息

| 项目属性 | 值 |
|---------|---|
| 项目名称 | ronnie-portfolio |
| 版本 | 0.0.0 |
| 作者 | Ronnie Bach（邮件签名：Klaus）|
| 部署服务器 | 本机 macmini（macOS，通过 Cloudflare Tunnel 暴露） |
| 域名 | ronniebach.club |
| CDN | Cloudflare |

---

## 2. 技术栈

### 2.1 前端技术

| 技术 | 版本 | 用途 |
|-----|------|------|
| React | 19.2.0 | UI 框架 |
| TypeScript | 5.9.3 | 类型安全 |
| Vite | 7.3.1 | 构建工具 |
| Tailwind CSS | 4.1.18 | 原子化 CSS（注：当前未实际使用 Tailwind 类，仅依赖已装） |
| ECharts | 6.0.0 | 数据可视化 |
| React Router DOM | 7.13.0 | 路由管理 |

### 2.2 后端技术

| 技术 | 版本 | 用途 |
|-----|------|------|
| Node.js | 18+（`.nvmrc` 指定） | 运行时 |
| Express | 4.18 | Web 框架 |
| MongoDB | 7.x | 数据库 |
| nodemailer | 8.x | SMTP 邮件发送 |
| dotenv | 17.x | 环境变量加载 |
| jose | 5.x | JWT 签发与验证 |
| bcryptjs | 2.4 | 密码哈希 |
| PM2 | 6.x | 进程管理（生产） |
| Nginx | 1.24+ | 反向代理（生产） |

### 2.3 开发工具

| 工具 | 用途 |
|-----|------|
| TypeScript | 类型检查 |
| ESLint | 代码规范 |
| Git | 版本控制 |

---

## 3. 项目结构

```
ronnie-portfolio/
├── .env.example             # 环境变量模板（不含真实凭据）
├── .gitignore               # Git 忽略配置（.env 已忽略）
├── package.json             # 前端依赖
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
├── tailwind.config.js       # Tailwind CSS 配置（已装但未实际使用）
├── index.html               # HTML 入口
│
├── src/                      # 前端源码
│   ├── main.tsx             # 应用入口（含 BrowserRouter）
│   ├── App.tsx              # 主应用组件（路由 + 首页卡片）
│   ├── index.css            # 全局样式
│   ├── ScrollToTop.tsx      # 路由切换滚动复位
│   │
│   ├── contexts/           # React Context
│   │   └── AuthContext.tsx # 认证上下文
│   │
│   ├── services/           # 服务层
│   │   └── api.ts          # API 调用封装
│   │
│   ├── data/               # 静态数据
│   │   └── blogs.ts        # 首页博客卡片数据
│   │
│   ├── assets/            # 静态资源（图标等）
│   │
│   └── *.tsx              # 页面组件
│       ├── Resume.tsx      # 个人简历
│       ├── Blog.tsx        # 博客系统
│       ├── Chart.tsx       # 数据报表（ECharts）
│       ├── German.tsx      # 德语学习
│       ├── Ordering.tsx    # 点餐页面
│       ├── DishManagement.tsx  # 菜单管理（admin）
│       └── Admin.tsx       # 管理后台（admin）
│
├── server/                  # 后端源码
│   ├── index.js            # Express 主文件（含 MongoDB + SMTP）
│   ├── package.json       # 后端依赖
│   ├── mongod.conf         # MongoDB 配置
│   ├── german-vocabulary.json   # 德语词汇数据
│   ├── import-german-vocab.js   # 词汇导入脚本
│   └── *.js               # 辅助脚本（历史遗留）
│       ├── check-notifs.js
│       ├── check-order.js
│       ├── send-notifications.js
│       ├── send-order-notifications.js
│       └── test-email.js
│
├── public/                  # 静态资源
│   ├── logo.png
│   ├── og-image.svg
│   ├── resume/              # 简历附件
│   ├── robots.txt
│   ├── sitemap.xml
│   └── vite.svg
│
└── dist/                    # 构建产物（部署用）
    ├── index.html
    └── assets/
```

> 注：组件目录 `src/components/` 暂为空，仅保留作为未来扩展用。

---

## 4. 功能模块

### 4.1 个人简历 (Resume)

**路径:** `/resume`  
**组件:** `Resume.tsx`  
**功能:** 展示个人简历信息

### 4.2 博客系统 (Blog)

**路径:** `/blog`  
**组件:** `Blog.tsx`  
**功能:**

- 文章列表展示
- 分类筛选
- 文章详情
- 管理员发布/删除文章

**数据表:** `posts`

### 4.3 数据报表 (Chart)

**路径:** `/chart`  
**组件:** `Chart.tsx`  
**功能:**

- 周访问趋势图
- 柱状图 + 折线图混合显示
- ECharts 可视化

### 4.4 德语学习 (German)

**路径:** `/german`  
**组件:** `German.tsx`  
**功能:**

- 词汇分类浏览
- 词汇学习
- 学习进度记录

**数据表:** `words`, `germanProgress`

### 4.5 点餐系统 (Ordering)

**路径:** `/ordering`  
**组件:** `Ordering.tsx`  
**功能:**

- 菜品浏览
- 购物车
- 下单功能（自动发邮件通知）

**权限:** `Frau` 或 `admin`  
**数据表:** `dishes`, `orders`, `notifications`

### 4.6 菜单管理 (Dish Management)

**路径:** `/dish-management`  
**组件:** `DishManagement.tsx`  
**功能:**

- 菜品 CRUD
- 分类管理（自动根据菜名归类）
- 自动生成食材清单

**权限:** 仅 admin

### 4.7 管理后台 (Admin)

**路径:** `/admin`  
**组件:** `Admin.tsx`  
**功能:**

- 用户管理（角色变更、删除）
- 文章管理（删除）
- 访问记录查询
- 统计概览

**权限:** 仅 admin

---

## 5. API 接口文档

### 5.1 认证模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |

> ⚠️ 当前 token 是 `token-{userId}` 字符串，不是 JWT。详见"安全风险"章节。

### 5.2 博客模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/posts` | 获取文章列表（支持 `?category=`） |
| GET | `/api/posts/:id` | 获取文章详情 |
| POST | `/api/posts` | 发布文章（需 admin） |
| DELETE | `/api/posts/:id` | 删除文章（需 admin） |

### 5.3 菜品模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/dishes` | 获取菜品列表（按名称排序） |
| GET | `/api/dishes/:id` | 获取菜品详情 |
| POST | `/api/dishes` | 添加菜品（自动生成食材） |
| PUT | `/api/dishes/:id` | 更新菜品 |
| DELETE | `/api/dishes/:id` | 删除菜品 |

### 5.4 订单模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/orders` | 获取订单列表（支持 `?date=&mealType=`） |
| GET | `/api/orders/user/:userId` | 获取某用户订单（限最近 30 条） |
| POST | `/api/orders` | 创建订单（触发邮件通知） |

### 5.5 通知模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| POST | `/api/notifications/send` | 通用发送（按 `channel` 路由） |
| POST | `/api/notifications/email` | 发送邮件（直接调用 SMTP） |
| POST | `/api/notifications/whatsapp` | 提交 WhatsApp 通知（OpenClaw 已下线，通道暂不可用） |

### 5.6 德语模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/german/topics` | 获取话题分类 |
| GET | `/api/german/vocabulary` | 获取词汇列表（支持 `?topic=&topic_id=&level=`） |
| GET | `/api/german/vocabulary/:id` | 获取词汇详情 |
| GET | `/api/german/progress/:userId` | 获取学习进度 |

### 5.7 游戏分数模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/scores` | 获取分数排行榜（前 10） |
| POST | `/api/scores` | 提交分数 |

### 5.8 管理模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/admin/users` | 获取用户列表（需 admin） |
| GET | `/api/admin/visits` | 获取访问记录（需 admin，前 200 条） |

### 5.9 通用模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/stats` | 获取统计数据（文章数、用户数、访问数） |
| GET | `/api/health` | 健康检查（含 DB 连接状态） |
| POST | `/api/track` | 手动记录访问（前端 keepalive 调用） |

---

## 6. 数据库设计

### 6.1 数据库信息

- **数据库名:** `ronnie_portfolio`
- **MongoDB 版本:** 7.0.29
- **认证:** 无（仅 bindIp: 127.0.0.1，依赖网络隔离）

### 6.2 数据表

| 表名 | 说明 |
|-----|------|
| `users` | 用户数据 |
| `posts` | 博客文章 |
| `dishes` | 菜品数据 |
| `orders` | 订单记录 |
| `notifications` | 通知发送记录 |
| `visits` | 访问记录（含 IP） |
| `words` | 德语词汇 |
| `germanProgress` | 学习进度 |
| `gameScores` | 游戏分数 |
| `talentVisits` | 访问统计（含 7 天 TTL 索引） |

### 6.3 集合结构示例

#### posts (文章)

```typescript
{
  _id: ObjectId,
  title: string,        // 标题
  content: string,       // Markdown 内容
  category: string,     // 分类
  date: string,        // 日期 (YYYY-MM-DD)
  summary: string,      // 摘要
  tags: string[],       // 标签
  createdAt: Date       // 创建时间
}
```

#### users (用户)

```typescript
{
  _id: ObjectId,
  email: string,
  name: string,
  password: string,     // ⚠️ 明文存储（见安全风险）
  bio?: string,
  role: string,        // 'admin' | 'user' | 'Frau'
  createdAt: Date
}
```

#### dishes (菜品)

```typescript
{
  _id: ObjectId,
  name: string,         // 菜品名称
  category: string,      // 分类
  ingredients: {        // 食材（自动填充）
    name: string,
    amount: number,
    unit: string
  }[],
  notes?: string,
  createdAt: Date,
  updatedAt?: Date
}
```

#### orders (订单)

```typescript
{
  _id: ObjectId,
  userId: string,
  userName: string,
  date: string,        // 订单日期
  mealType: 'breakfast' | 'lunch' | 'dinner',
  dishes: Dish[],       // 菜品 + 食材
  notes: string,
  status: 'pending' | 'confirmed' | 'done',
  createdAt: Date
}
```

#### words (德语词汇)

```typescript
{
  _id: ObjectId,
  word: string,         // 德语词
  meaning: string,       // 中文含义
  examples?: {          // 例句
    german?: string,
    chinese?: string
  }[],
  topic: string,       // 话题分类
  level?: string        // CEFR 等级
}
```

---

## 7. 部署架构

### 7.1 架构总览

项目运行在本机 macmini（macOS）上，通过 Cloudflare Tunnel 暴露到公网：

```
浏览器用户
    ↓ (HTTPS)
Cloudflare 边缘网络
    ↓ (Cloudflare Tunnel)
cloudflared（launchd: homebrew.mxcl.cloudflared）
    ↓
┌────────────────────────────────────────────────┐
│              本机 macmini                        │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ ronniebach.club → 127.0.0.1:5173        │  │
│  │ (vite preview，com.ronniebach.web)        │  │
│  └─────────────────────────────────────────┘  │
│                    ↓ 静态资源                     │
│  ┌─────────────────────────────────────────┐  │
│  │ api.ronniebach.club → 127.0.0.1:3001     │  │
│  │ (Express API，com.ronniebach.api)         │  │
│  └─────────────────────────────────────────┘  │
│                    ↓ Mongoose                   │
│  ┌─────────────────────────────────────────┐  │
│  │ MongoDB (homebrew.mxcl.mongodb-community) │  │
│  │ 127.0.0.1:27017                          │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  com.ronniebach.healthcheck 每 30 分钟检查       │
└────────────────────────────────────────────────┘
```

### 7.2 launchd 服务清单

| Label | 程序 | 监听 | plist 路径 |
|-------|------|------|------------|
| `homebrew.mxcl.cloudflared` | cloudflared tunnel | - | `~/Library/LaunchAgents/homebrew.mxcl.cloudflared.plist` |
| `homebrew.mxcl.mongodb-community` | mongod | 27017 | `~/Library/LaunchAgents/homebrew.mxcl.mongodb-community.plist` |
| `com.ronniebach.web` | `npx vite preview --port 5173` | 5173 | `~/Library/LaunchAgents/com.ronniebach.web.plist` |
| `com.ronniebach.api` | `node server/index.js` | 3001 | `~/Library/LaunchAgents/com.ronniebach.api.plist` |
| `com.ronniebach.healthcheck` | `bash healthcheck.sh`（每 1800s） | - | `~/Library/LaunchAgents/com.ronniebach.healthcheck.plist` |

### 7.3 端口配置

| 端口 | 服务 | 协议 | 状态 |
|------|------|------|------|
| 5173 | vite preview（前端静态） | TCP 127.0.0.1 | ✅ 仅本地 |
| 3001 | Express API | TCP 0.0.0.0 | ✅ 仅本地 |
| 27017 | MongoDB | TCP 127.0.0.1 | ✅ 仅本地 |

> 注：项目没有对外开放任何端口，所有对外通信通过 cloudflared 出站连接。

### 7.4 域名映射（cloudflared ingress）

| 域名 | 转发目标 | 用途 |
|------|---------|------|
| `ronniebach.club` | `http://127.0.0.1:5173` | 前端静态（vite preview） |
| `api.ronniebach.club` | `http://127.0.0.1:3001` | 后端 API |
| 其他 | `http_status:404` | 默认拒绝 |

配置文件：`~/.cloudflared/config.yml`
凭证文件：`~/.cloudflared/1db7396c-71ee-4507-bc9b-76790215aa4d.json`
Tunnel ID：`ronnie-mac`（UUID `1db7396c-71ee-4507-bc9b-76790215aa4d`）

### 7.5 服务管理

```bash
# 单服务管理
launchctl kickstart -k gui/$(id -u)/com.ronniebach.api       # 重启后端
launchctl kickstart -k gui/$(id -u)/com.ronniebach.web       # 重启前端
launchctl kickstart -k gui/$(id -u)/homebrew.mxcl.cloudflared # 重启 tunnel
brew services restart mongodb-community                       # 重启 MongoDB

# 查看状态
launchctl list | grep -E "ronniebach|cloudflare|mongodb"
lsof -nP -iTCP:3001 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN

# 详细操作 SOP 见 docs/OPERATIONS.md
```

---

## 8. 运维指南

### 8.1 日常维护

```bash
# 检查服务状态
pm2 status

# 检查磁盘空间
df -h

# 检查内存使用
free -m

# 检查 API 响应
curl https://ronniebach.club/api/health

# 检查 SMTP 是否正常（生产 .env 配置后）
curl -X POST https://ronniebach.club/api/notifications/email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-test@example.com","subject":"test","body":"hello"}'
```

### 8.2 部署更新

```bash
# 1. 进入项目目录（本机操作）
cd /Users/macmini/RonnieBach

# 3. 拉取代码
git pull

# 4. 同步依赖（package.json 有变更时）
npm install
rm package-lock.json node_modules -rf && npm install    # 清理残留时

# 5. 重新构建前端
npm run build

# 6. 重启后端
pm2 restart ronnie-backend

# 7. 验证
curl https://ronniebach.club/api/health
curl https://ronniebach.club/api/stats
```

### 8.3 环境变量配置

部署时确保 `.env` 文件存在并填入真实值（参考 `.env.example`）：

```bash
cd /Users/macmini/RonnieBach
cp .env.example .env
nano .env  # 填入 SMTP_USER / SMTP_PASS 等
launchctl kickstart -k gui/$(id -u)/com.ronniebach.api    # 让 api 重新加载 .env
```

未配置 `.env` 时 server 会启动并使用内置 fallback（带警告），但不推荐长期使用 fallback。

### 8.4 日志位置

| 日志 | 位置 |
|-----|------|
| 后端 (api) | `~/Library/Logs/RonnieBach/api.{out,err}.log` |
| 前端 (web) | `~/Library/Logs/RonnieBach/web.{out,err}.log` |
| 健康检查 | `~/Library/Logs/RonnieBach/healthcheck.{out,err}.log` |
| 健康检查历史 | `~/.openclaw/workspace/memory/healthcheck-failures.log` |
| MongoDB | `/opt/homebrew/var/log/mongodb/mongo.log` |

### 8.5 备份

- **代码:** Git 版本控制（远程仓库）
- **数据库:** 见"常见问题"章节的 `mongodump` 示例
- **静态构建产物:** 由 Git 保证

### 8.6 安全配置

**已实施:**

- ✅ SMTP 凭据使用环境变量（`.env`）
- ✅ `.env` 已在 `.gitignore`
- ✅ MongoDB 仅监听 127.0.0.1（依赖网络隔离，无密码）
- ✅ 所有对外通信通过 cloudflared 出站隧道（无入站端口暴露）
- ✅ 系统包定期更新（Homebrew + 系统更新）

**未实施（见安全风险章节）:**

- ❌ 密码哈希
- ❌ JWT token
- ❌ MongoDB 启用认证（依赖网络隔离）

---

## 9. 安全风险

> 本节列出已知但尚未修复的安全问题，作为记录与未来改造的指引。

### 9.1 密码明文存储（已修复）

**历史:** 老版本 `server/index.js` 注册时直接存明文、登录时明文比对。

**修复（2026-09-02）:** 引入 `bcryptjs`，注册时 `bcrypt.hash(password, 10)`，登录时 `bcrypt.compare()`。同时实现**渐进迁移**：明文密码用户登录成功后自动重新哈希为 bcrypt 并添加 `passwordMigratedAt` 时间戳。

**当前状态:** 所有用户密码均已为 bcrypt hash（已通过测试）。数据库已无明文密码。

### 9.2 弱 token 机制（已修复）

**历史:** `/api/auth/login` 返回 `token-${userId}` 字符串，任何持有 userId 字符串的人都能模拟该用户。

**修复（2026-09-02）:** 引入 `jose` 库，实现 HS256 签名 token（不设过期时间，符合当前设计选择）。前端改用 `Authorization: Bearer <token>` header。

**当前状态:** 所有鉴权端点使用 JWT，包含 `id, email, role, iat, iss` claims。Token 验证通过 `jose.jwtVerify()` + issuer 校验。

**未来改进:** 当前不设过期时间（exp claim）。如未来需要过期，在 `SignJWT` 后加 `.setExpirationTime('24h')`，并让前端处理 401 跳转登录。

### 9.3 SMTP 凭据曾在 git 历史中明文（已修复）

SMTP 授权码曾在 `server/index.js` 中硬编码并提交。

**修复（2026-09-02）:** 用 BFG Repo-Cleaner 重写整个 git 历史，9 个 commit 全部更新 hash，敏感字符串替换为 `REDACTED-*` 占位。GitHub 远程尚未 force-push（需要本地执行 `git push --force-with-lease origin main`）。

**剩余动作:**
- ⚠️ **你必须执行 force-push**（我没 GitHub 凭据）
- ⚠️ 在 QQ 邮箱设置 → 账户 → 关闭旧授权码、生成新授权码（本地 .env 已支持）

> ⚠️ GitHub 的 web 缓存可能仍含旧内容（GitHub 主动清除需要提交 Security Advisories）。

### 9.4 cloudflared ingress 配置未在仓库中跟踪

`~/.cloudflared/config.yml` 是用户机器上的本地配置，不在 git 仓库中。任何 ingress 改动需要手动维护，并在多台机器同步时需注意一致性。

---

## 10. 常见问题

### Q1: 前端构建失败

```bash
# 检查 Node.js 版本
node -v    # 应为 18+

# 重新安装依赖
rm -rf node_modules
npm install

# 重新构建
npm run build
```

### Q2: MongoDB 连接失败

```bash
# 检查 MongoDB 状态
sudo systemctl status mongod

# 检查连接
mongosh "mongodb://127.0.0.1:27017/ronnie_portfolio"
```

### Q3: API 返回 500

```bash
# 查看后端日志
pm2 logs ronnie-backend

# 检查环境变量
cat /Users/macmini/RonnieBach/.env

# 检查 SMTP 是否配置
node -e "console.log(process.env.SMTP_USER)"
```

### Q4: HTTPS 证书问题

```bash
# 检查 Nginx 配置
sudo nginx -t

# 重载 Nginx
sudo nginx -s reload

# 检查证书
openssl s_client -connect ronniebach.club:443
```

### Q5: 邮件通知未发出

```bash
# 1. 确认 .env 已配置
cat /Users/macmini/RonnieBach/.env

# 2. 手动测试
curl -X POST http://localhost:3001/api/notifications/email \
  -H "Content-Type: application/json" \
  -d '{"to":"target@example.com","subject":"test","body":"hello"}'

# 3. 查看日志
pm2 logs ronnie-backend | grep -E "📧|邮件"
```

### Q6: 数据库备份与恢复

```bash
# 备份
mongodump --uri "mongodb://127.0.0.1:27017/ronnie_portfolio" --gzip --archive=backup-$(date +%Y%m%d).gz

# 恢复
mongorestore --uri "mongodb://127.0.0.1:27017/ronnie_portfolio" --gzip --archive=backup-20260902.gz --drop
```

---

## 附录

### A. 命令速查

```bash
# 服务管理
pm2 status                    # 查看状态
pm2 restart ronnie-backend    # 重启后端
pm2 logs                      # 查看日志

# 构建部署
npm run build                 # 构建前端
sudo nginx -s reload          # 重载 Nginx

# 数据库
mongosh "mongodb://127.0.0.1:27017/ronnie_portfolio"
mongodump --uri "..." --gzip --archive=backup.gz   # 备份

# 系统
sudo ufw status               # 防火墙状态
df -h                         # 磁盘使用
free -m                       # 内存使用
```

### B. 文件位置

| 文件 | 位置 |
|-----|------|
| 项目根目录 | `/Users/macmini/RonnieBach` |
| 后端代码 | `/Users/macmini/RonnieBach/server/index.js` |
| 环境变量 | `/Users/macmini/RonnieBach/.env` |
| 环境变量模板 | `/Users/macmini/RonnieBach/.env.example` |
| cloudflared 配置 | `~/.cloudflared/config.yml` |
| cloudflared 凭证 | `~/.cloudflared/1db7396c-71ee-4507-bc9b-76790215aa4d.json` |
| launchd plist（web/api/healthcheck） | `~/Library/LaunchAgents/com.ronniebach.*.plist` |
| launchd plist（cloudflared） | `~/Library/LaunchAgents/homebrew.mxcl.cloudflared.plist` |
| launchd plist（mongodb） | `~/Library/LaunchAgents/homebrew.mxcl.mongodb-community.plist` |
| 服务日志 | `~/Library/Logs/RonnieBach/{api,web,healthcheck}.{out,err}.log` |
| 健康检查脚本 | `~/Library/Scripts/RonnieBach/healthcheck.sh` |

### C. 相关链接

- **网站:** https://ronniebach.club
- **API 子域名:** https://api.ronniebach.club

---

*文档维护者: Ronnie - 2026-09-02*