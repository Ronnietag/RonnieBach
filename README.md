# Ronnie Portfolio

> 个人作品集网站 - React + TypeScript + Vite

## 功能模块

### 1. 首页 (/)
- 作品集入口，显示所有功能卡片
- 用户认证系统（登录/注册）
- 响应式布局，滚动渐变效果

### 2. 个人介绍 (/resume)
- 展示个人信息、技能、经验

### 3. 博客 (/blog)
- 技术文章展示
- Markdown 内容支持

### 4. 数据报表 (/chart)
- 数据可视化展示
- 统计图表

### 5. 德语学习 (/german)
- 德语词汇学习工具
- 词汇卡、测试功能

### 6. 点菜系统 (/ordering)
- **权限**: 仅 `Frau` 和 `admin` 用户可见
- 每日菜单选择
- 购物车功能
- 订单提交（通过 SMTP 邮件通知）

### 7. 管理后台 (/admin)
- **权限**: 仅 `admin` 用户可见
- 用户管理、文章管理、访问记录

### 8. 菜单管理 (/dish-management)
- **权限**: 仅 `admin` 用户可见
- 菜品 CRUD（自动根据菜名生成食材清单）

## 技术栈

- **前端**: React 19.2 + TypeScript 5.9 + Vite 7
- **后端**: Express.js 4 + MongoDB 7
- **邮件**: nodemailer（QQ 邮箱 SMTP）
- **状态管理**: React Context + localStorage
- **样式**: 原生 CSS + CSS Variables

## 项目结构

```
src/
├── App.tsx              # 主应用组件（路由 + 首页卡片）
├── main.tsx            # 入口文件
├── index.css           # 全局样式
├── Resume.tsx          # 个人介绍
├── Blog.tsx            # 博客
├── Chart.tsx           # 数据报表
├── German.tsx          # 德语学习
├── Ordering.tsx        # 点菜系统
├── DishManagement.tsx  # 菜单管理
├── Admin.tsx           # 管理后台
├── ScrollToTop.tsx     # 路由切换滚动复位
├── contexts/
│   └── AuthContext.tsx # 认证上下文
├── services/
│   └── api.ts          # API 调用封装
└── data/
    └── blogs.ts        # 静态博客卡片数据

server/
├── index.js            # Express 服务器（含 MongoDB 连接 + SMTP）
├── package.json        # 后端依赖
├── mongod.conf         # MongoDB 配置
├── german-vocabulary.json   # 德语词汇数据
└── import-german-vocab.js  # 词汇导入脚本
```

## API 接口

### 认证

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |

### 博客

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/posts | 获取文章列表（支持 `?category=`） |
| GET | /api/posts/:id | 获取文章详情 |
| POST | /api/posts | 发布文章（需 admin） |
| DELETE | /api/posts/:id | 删除文章（需 admin） |

### 菜品

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/dishes | 获取菜品列表 |
| GET | /api/dishes/:id | 获取菜品详情 |
| POST | /api/dishes | 添加菜品（自动生成食材） |
| PUT | /api/dishes/:id | 更新菜品 |
| DELETE | /api/dishes/:id | 删除菜品 |

### 订单

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/orders | 获取订单列表（支持 `?date=&mealType=`） |
| GET | /api/orders/user/:userId | 获取某用户订单 |
| POST | /api/orders | 创建订单（触发邮件通知） |

### 通知

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/notifications/send | 通用发送（channel=email/whatsapp） |
| POST | /api/notifications/email | 发送邮件 |
| POST | /api/notifications/whatsapp | 提交 WhatsApp 通知（OpenClaw 已下线，通道暂不可用） |

### 德语

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/german/topics | 获取话题分类 |
| GET | /api/german/vocabulary | 获取词汇列表（支持 `?topic=&level=`） |
| GET | /api/german/vocabulary/:id | 获取词汇详情 |
| GET | /api/german/progress/:userId | 获取学习进度 |

### 游戏分数

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/scores | 获取分数排行榜 |
| POST | /api/scores | 提交分数 |

### 管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/admin/users | 获取用户列表（需 admin） |
| GET | /api/admin/visits | 获取访问记录（需 admin） |

### 通用

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/stats | 获取统计数据（文章数、用户数、访问数） |
| POST | /api/track | 手动记录访问（前端 keepalive 调用） |
| GET | /api/health | 健康检查（含 DB 状态） |

## 环境要求

- Node.js 18+（`.nvmrc` 指定）
- MongoDB 7
- QQ 邮箱 SMTP 授权码（用于点菜邮件通知）

## 启动

```bash
# 安装依赖
npm install
cd server && npm install && cd ..

# 配置环境变量（参考 .env.example）
cp .env.example .env
# 编辑 .env，填入 SMTP_USER / SMTP_PASS

# 开发模式（前端 + 后端）
npm run start

# 仅前端开发
npm run dev

# 生产构建
npm run build

# 仅启动后端
npm run server
```

## 权限系统

| 角色 | 可访问模块 |
|------|----------|
| admin | 所有模块（含 /admin、/dish-management） |
| Frau | 点菜系统（/ordering） |
| user | 基础模块（博客、报表、德语学习） |
| guest | 公开模块（首页、博客、报表、德语学习） |

## 已知风险

- 密码以明文存储于 MongoDB（未做 bcrypt 哈希）。详见 `PROJECT_DOCUMENTATION.md` 的安全章节。

## 最近更新

### 2026-09-02
- 后端补全 `POST /api/notifications/send` 通用通道 + 修复 `POST /api/notifications/email` 的循环自引用
- 后端新增 `POST /api/track` 端点
- SMTP 凭据迁移到 `.env`，新增 `.env.example` 模板
- 删除未被引用的 `HeaderFooter.tsx` 组件
- 清理 package.json 中的 parcel / html-inline 等无用依赖
- 文档同步：README 与代码保持一致

### 2026-04-21
- 集成 Hermes AI 对话模块（**已下线**，前端路由移除，后端无对应 API）