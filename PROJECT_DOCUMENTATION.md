# Ronnie Portfolio 项目文档

> 最后更新: 2026-02-12  
> 作者: Klaus

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
9. [常见问题](#9-常见问题)

---

## 1. 项目概述

### 1.1 项目简介

Ronnie Portfolio 是一个个人全栈 Web 应用项目，包含以下功能：

- 个人主页 & 简历展示
- 技术博客发布系统
- 德语学习辅助工具
- 点餐系统
- 小游戏（贪吃蛇、打砖块）
- 数据统计报表

### 1.2 项目信息

| 项目属性 | 值 |
|---------|---|
| 项目名称 | ronnie-portfolio |
| 版本 | 0.0.0 |
| 作者 | Ronnie Bach |
| 部署服务器 | AWS Ubuntu (43.207.100.207) |
| 域名 | ronniebach.club |
| CDN | Cloudflare |

---

## 2. 技术栈

### 2.1 前端技术

| 技术 | 版本 | 用途 |
|-----|------|------|
| React | 19.2.0 | UI 框架 |
| TypeScript | 5.9 | 类型安全 |
| Vite | 7.2.4 | 构建工具 |
| Tailwind CSS | 4.1.18 | 原子化 CSS |
| ECharts | 6.0.0 | 数据可视化 |
| React Router DOM | 7.13.0 | 路由管理 |

### 2.2 后端技术

| 技术 | 版本 | 用途 |
|-----|------|------|
| Node.js | 24.x | 运行时 |
| Express | - | Web 框架 |
| MongoDB | 7.0.29 | 数据库 |
| PM2 | 6.0.14 | 进程管理 |
| Nginx | 1.24.0 | 反向代理 |

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
├── .env                      # 环境变量 (敏感)
├── .gitignore               # Git 忽略配置
├── package.json             # 前端依赖
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
├── tailwind.config.js       # Tailwind CSS 配置
├── index.html               # HTML 入口
├── ecosystem.config.cjs      # PM2 配置
│
├── src/                      # 前端源码
│   ├── main.tsx             # 应用入口
│   ├── App.tsx              # 主应用组件
│   ├── index.css            # 全局样式
│   │
│   ├── components/          # 公共组件
│   │   └── HeaderFooter.tsx # 导航栏组件
│   │
│   ├── contexts/           # React Context
│   │   └── AuthContext.tsx # 认证上下文
│   │
│   ├── data/               # 静态数据
│   │   └── blogs.ts        # 首页博客卡片数据
│   │
│   ├── services/           # 服务层
│   │   └── api.ts          # API 调用封装
│   │
│   ├── assets/            # 静态资源
│   │   └── favicon.ico
│   │
│   ├── *.tsx              # 页面组件
│   │   ├── Resume.tsx      # 个人简历
│   │   ├── Blog.tsx        # 博客系统
│   │   ├── Chart.tsx      # 数据报表
│   │   ├── German.tsx      # 德语学习
│   │   ├── Ordering.tsx   # 点餐页面
│   │   ├── DishManagement.tsx  # 菜单管理
│   │   ├── Admin.tsx      # 管理后台
│   │   ├── Games.tsx      # 游戏中心
│   │   ├── Snake.tsx      # 贪吃蛇
│   │   ├── RoguelikeBreakout.tsx  # 打砖块
│   │   └── BreakoutPage.tsx      # 打砖块页面
│   │
│   └── brick-breaker/     # 打砖块游戏资源
│
├── server/                  # 后端源码
│   ├── index.js            # Express 主文件
│   ├── mongod.conf         # MongoDB 配置
│   ├── package.json       # 后端依赖
│   │
│   ├── german-vocabulary.json  # 德语词汇数据
│   ├── import-german-vocab.js # 词汇导入脚本
│   │
│   └── *.js               # 辅助脚本
│       ├── check-notifs.js     # 检查通知
│       ├── check-order.js      # 检查订单
│       ├── send-notifications.js  # 发送通知
│       ├── send-order-notifications.js  # 发送订单通知
│       └── test-email.js       # 邮件测试
│
├── blogs/                   # 博客 Markdown 文件
│   └── *.md
│
└── dist/                   # 构建产物 (部署用)
    ├── index.html
    └── assets/
```

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
- 下单功能
- 邮件通知

**数据表:** `dishes`, `orders`, `notifications`

### 4.6 菜单管理 (Dish Management)

**路径:** `/dish-management`  
**组件:** `DishManagement.tsx`  
**功能:**

- 菜品 CRUD
- 分类管理

### 4.7 游戏中心 (Games)

**路径:** `/games`  
**组件:** `Games.tsx`, `Snake.tsx`, `RoguelikeBreakout.tsx`  
**功能:**

- 游戏列表
- 贪吃蛇
- 打砖块 (Roguelike 风格)

**数据表:** `gameScores`

### 4.8 管理后台 (Admin)

**路径:** `/admin`  
**组件:** `Admin.tsx`  
**功能:**

- 用户管理
- 文章管理
- 访问统计

**权限:** 仅 admin 角色可访问

---

## 5. API 接口文档

### 5.1 认证模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |

### 5.2 博客模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/posts` | 获取文章列表 |
| GET | `/api/posts/:id` | 获取文章详情 |
| POST | `/api/posts` | 发布文章 (需 admin) |
| DELETE | `/api/posts/:id` | 删除文章 (需 admin) |

### 5.3 菜品模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/dishes` | 获取菜品列表 |
| GET | `/api/dishes/:id` | 获取菜品详情 |
| POST | `/api/dishes` | 添加菜品 |
| PUT | `/api/dishes/:id` | 更新菜品 |
| DELETE | `/api/dishes/:id` | 删除菜品 |

### 5.4 订单模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/orders` | 获取订单列表 |
| GET | `/api/orders/user/:userId` | 获取用户订单 |
| POST | `/api/orders` | 创建订单 |

### 5.5 通知模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| POST | `/api/notifications/whatsapp` | WhatsApp 通知 |
| POST | `/api/notifications/email` | 邮件通知 |

### 5.6 德语模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/german/topics` | 获取话题分类 |
| GET | `/api/german/vocabulary` | 获取词汇列表 |
| GET | `/api/german/vocabulary/:id` | 获取词汇详情 |
| GET | `/api/german/progress/:userId` | 获取学习进度 |

### 5.7 游戏模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/scores` | 获取分数排行 |
| POST | `/api/scores` | 提交分数 |

### 5.8 管理模块

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/admin/users` | 获取用户列表 (需 admin) |
| GET | `/api/admin/visits` | 获取访问记录 (需 admin) |

### 5.9 其他

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/stats` | 获取统计数据 |
| GET | `/api/health` | 健康检查 |

---

## 6. 数据库设计

### 6.1 数据库信息

- **数据库名:** `ronnie_portfolio`
- **MongoDB 版本:** 7.0.29
- **认证:** SCRAM-SHA-256 (用户名: ronnie)

### 6.2 数据表

| 表名 | 记录数 | 说明 |
|-----|--------|------|
| posts | 12 | 博客文章 |
| users | 4 | 用户数据 |
| dishes | 4 | 菜品数据 |
| orders | 29 | 订单记录 |
| notifications | 26 | 通知记录 |
| visits | 823 | 访问记录 |
| words | 543 | 德语词汇 |
| germanProgress | 1 | 学习进度 |
| config | 2 | 配置数据 |
| gameScores | 0 | 游戏分数 |
| talentVisits | 1 | 访问统计 |

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
  password: string,     // 加密存储
  bio?: string,
  role: string,        // 'admin' | 'user'
  createdAt: Date
}
```

#### dishes (菜品)

```typescript
{
  _id: ObjectId,
  name: string,         // 菜品名称
  category: string,      // 分类
  ingredients: string[], // 食材列表
  description?: string,   // 描述
  image?: string,       // 图片 URL
  price?: number,       // 价格
  available: boolean    // 是否上架
}
```

#### words (德语词汇)

```typescript
{
  _id: ObjectId,
  id: number,
  word: string,         // 德语词
  chinese_meaning: string, // 中文含义
  examples?: {          // 例句
    sentence: string,
    translation: string
  }[],
  topic: string,       // 话题分类
  cefr_level?: string   // CEFR 等级
}
```

---

## 7. 部署架构

### 7.1 服务器配置

| 项目 | 配置 |
|-----|------|
| 服务器 | AWS Ubuntu (43.207.100.207) |
| CPU | AWS EC2 |
| 内存 | 约 1GB+ |
| 磁盘 | EBS |

### 7.2 架构图

```
用户浏览器
    ↓ (HTTPS)
Cloudflare CDN
    ↓ (Cloudflare Origin SSL)
Nginx (443)
    ↓ (反向代理)
┌─────────────────────────────┐
│         AWS 服务器           │
│  ┌─────────────────────┐   │
│  │ Nginx (80, 443)    │   │
│  └─────────────────────┘   │
│         ↓                   │
│  ┌─────────────────────┐   │
│  │ PM2 (Cluster Mode) │   │
│  │ ├── ronnie-backend │   │  ← localhost:3001
│  │ └── (frontend stopped) │  ← 4173 (已关闭)
│  └─────────────────────┘   │
│         ↓                   │
│  ┌─────────────────────┐   │
│  │ MongoDB           │   │  ← localhost:27017
│  └─────────────────────┘   │
└─────────────────────────────┘
```

### 7.3 端口配置

| 端口 | 服务 | 协议 | 访问范围 | 状态 |
|------|------|------|---------|------|
| 22 | SSH | TCP | 0.0.0.0/0 | ✅ 开放 |
| 80 | Nginx HTTP | TCP | 0.0.0.0/0 | ✅ 开放 |
| 443 | Nginx HTTPS | TCP | 0.0.0.0/0 | ✅ 开放 |
| 3001 | Backend API | TCP | 127.0.0.1 | ✅ 本地 |
| 27017 | MongoDB | TCP | 127.0.0.1 | ✅ 本地 |
| 18789 | OpenClaw | TCP | 0.0.0.0/0 | ✅ 开放 |

### 7.4 SSL 证书

| 类型 | 颁发者 | 状态 |
|-----|--------|------|
| Origin Certificate | Cloudflare Origin CA | ✅ 已配置 |

### 7.5 PM2 进程管理

```bash
# 查看状态
pm2 status

# 重启服务
pm2 restart ronnie-backend

# 查看日志
pm2 logs

# 重载配置
pm2 reload all
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
```

### 8.2 部署更新

```bash
# 1. 拉取代码
cd /home/ubuntu/.openclaw/workspace/ronnie-portfolio
git pull

# 2. 构建前端
npm run build

# 3. 重启服务
pm2 restart ronnie-backend

# 4. 验证
curl https://ronniebach.club/api/posts
```

### 8.3 日志位置

| 日志 | 位置 |
|-----|------|
| PM2 日志 | `pm2 logs` |
| Nginx 错误 | `/var/log/nginx/error.log` |
| 应用日志 | `/tmp/server.log` |

### 8.4 备份

- **自动:** Git 每日自动同步 (19:00 UTC)
- **手动:** `git add . && git commit -m "update" && git push`

### 8.5 安全配置

**已实施:**

- ✅ MongoDB 密码使用环境变量 (`.env`)
- ✅ UFW 防火墙已启用
- ✅ 关闭不必要的端口 (3000, 21, 3389)
- ✅ 系统包定期更新

---

## 9. 常见问题

### Q1: 前端构建失败

```bash
# 检查 Node.js 版本
node -v

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
mongosh "mongodb://ronnie:Ronnie2026@127.0.0.1:27017/ronnie_portfolio?authSource=admin"
```

### Q3: API 返回 500

```bash
# 查看后端日志
pm2 logs ronnie-backend

# 检查环境变量
cat /home/ubuntu/.openclaw/workspace/ronnie-portfolio/.env
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

---

## 附录

### A. 命令速查

```bash
# 服务管理
pm2 status                    # 查看状态
pm2 restart ronnie-backend   # 重启后端
pm2 logs                     # 查看日志

# 构建部署
npm run build               # 构建前端
sudo nginx -s reload        # 重载 Nginx

# 数据库
mongosh "mongodb://ronnie:Ronnie2026@127.0.0.1:27017/ronnie_portfolio?authSource=admin"

# 系统
sudo ufw status             # 防火墙状态
df -h                       # 磁盘使用
free -m                     # 内存使用
```

### B. 文件位置

| 文件 | 位置 |
|-----|------|
| 项目根目录 | `/home/ubuntu/.openclaw/workspace/ronnie-portfolio` |
| 后端代码 | `/home/ubuntu/.openclaw/workspace/ronnie-portfolio/server/index.js` |
| PM2 配置 | `/home/ubuntu/.openclaw/workspace/ronnie-portfolio/ecosystem.config.cjs` |
| Nginx 配置 | `/etc/nginx/sites-available/ronniebach` |
| SSL 证书 | `/etc/ssl/certs/cloudflare-origin.crt` |

### C. 相关链接

- **网站:** https://ronniebach.club
- **GitHub:** (如已配置)
- **Cloudflare:** https://dash.cloudflare.com

---

*文档由 Klaus 生成 - 2026-02-12*
