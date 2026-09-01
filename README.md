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
- 订单提交

### 7. 游戏 (/games)
- 贪吃蛇游戏
- 俄罗斯方块游戏

### 8. Hermes AI 对话 (/hermes)
- **权限**: 仅 `admin` 用户可见
- AI 助手对话界面
- Session 管理（可切换历史会话）
- 流式响应（打字机效果）
- 等待动画（三个点）

### 9. 管理后台 (/admin)
- **权限**: 仅 `admin` 用户可见
- 菜单管理 (/dish-management)

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **后端**: Express.js + MongoDB
- **状态管理**: React Context + localStorage
- **样式**: CSS Variables + Flexbox/Grid

## 项目结构

```
src/
├── App.tsx              # 主应用组件
├── main.tsx            # 入口文件
├── index.css           # 全局样式
├── HermesChat.tsx      # Hermes AI 对话模块
├── HermesChat.css      # Hermes 样式
├── Ordering.tsx         # 点菜系统
├── DishManagement.tsx  # 菜单管理
├── Admin.tsx           # 管理后台
├── Games.tsx           # 游戏列表
├── German.tsx           # 德语学习
├── Blog.tsx            # 博客
├── Resume.tsx           # 个人介绍
├── Chart.tsx           # 数据报表
├── Snake.tsx           # 贪吃蛇游戏
├── BreakoutPage.tsx    # 俄罗斯方块
├── contexts/
│   └── AuthContext.tsx # 认证上下文
└── components/
    └── HeaderFooter.tsx

server/
├── index.js            # Express 服务器
└── ...                 # 后端配置
```

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/stats | 获取统计数据 |
| POST | /api/track | 跟踪页面访问 |
| GET | /api/dishes | 获取菜品列表 |
| POST | /api/dishes | 添加菜品 |
| GET | /api/orders | 获取订单 |
| POST | /api/orders | 创建订单 |
| GET | /api/hermes/sessions | 获取 Hermes 会话列表 |
| GET | /api/hermes/sessions/:id/messages | 获取会话消息历史 |
| POST | /api/hermes/chat | 发送消息到 Hermes (SSE 流式) |

## Hermes 对接

Hermes AI 通过 OpenAI 兼容 API (localhost:8642) 进行通信:

- **API 端点**: `http://localhost:8642/v1/chat/completions`
- **会话管理**: 支持从 Hermes sessions 列表切换
- **流式响应**: Server-Sent Events (SSE)
- **历史记录**: 从 Hermes CLI `sessions export` 获取

## 环境要求

- Node.js 18+
- MongoDB
- Hermes Agent (运行在 localhost:8642)

## 启动

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build

# 启动服务器
node server/index.js
```

## 权限系统

| 角色 | 可访问模块 |
|------|----------|
| admin | 所有模块包括 Hermes |
| Frau | 点菜系统 |
| user | 基础模块（博客、报表、游戏等）|
| guest | 公开模块 |

## 最近更新

### 2026-04-21
- 集成 Hermes AI 对话模块
- 支持多会话管理和历史记录切换
- 实现 SSE 流式响应
- 添加管理员权限控制
- 会话选择器改为按钮式下拉菜单
