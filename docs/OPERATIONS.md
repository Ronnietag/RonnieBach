# 运维 SOP (Standard Operating Procedure)

> 适用对象：Ronnie Portfolio **本地开发与生产**（macOS）  
> 服务器：本机（macmini）  
> 域名：ronniebach.club（通过 Cloudflare Tunnel 暴露）  
> 最后更新：2026-09-02

---

## 📋 目录

1. [架构总览](#1-架构总览)
2. [日常检查](#2-日常检查)
3. [代码部署](#3-代码部署)
4. [服务管理](#4-服务管理)
5. [tunnel 管理（cloudflared）](#5-tunnel-管理cloudflared)
6. [数据库管理](#6-数据库管理)
7. [健康检查](#7-健康检查)
8. [故障排查](#8-故障排查)
9. [紧急响应](#9-紧急响应)
10. [凭据轮换](#10-凭据轮换)
11. [已知问题](#11-已知问题)

---

## 1. 架构总览

### 1.1 真实运行架构（当前）

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
│  │ (vite preview，由 launchd 守护)            │  │
│  │ com.ronniebach.web                       │  │
│  └─────────────────────────────────────────┘  │
│                    ↓ 静态资源                     │
│  ┌─────────────────────────────────────────┐  │
│  │ api.ronniebach.club → 127.0.0.1:3001     │  │
│  │ (Node.js Express，由 launchd 守护)         │  │
│  │ com.ronniebach.api                       │  │
│  └─────────────────────────────────────────┘  │
│                    ↓ Mongoose                   │
│  ┌─────────────────────────────────────────┐  │
│  │ MongoDB (homebrew.mxcl.mongodb-community) │  │
│  │ 127.0.0.1:27017                          │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  com.ronniebach.healthcheck 每 30 分钟检查       │
│  ~/Library/Scripts/RonnieBach/healthcheck.sh   │
└────────────────────────────────────────────────┘
```

### 1.2 关键进程清单

| launchd Label | 程序 | 监听端口 | 配置文件 |
|---------------|------|---------|---------|
| `homebrew.mxcl.cloudflared` | cloudflared tunnel | - | `~/.cloudflared/config.yml` |
| `homebrew.mxcl.mongodb-community` | mongod | 27017 | `/opt/homebrew/etc/mongod.conf` |
| `com.ronniebach.web` | npx vite preview | 5173 | `~/Library/LaunchAgents/com.ronniebach.web.plist` |
| `com.ronniebach.api` | node server/index.js | 3001 | `~/Library/LaunchAgents/com.ronniebach.api.plist` |
| `com.ronniebach.healthcheck` | bash healthcheck.sh | - | `~/Library/LaunchAgents/com.ronniebach.healthcheck.plist` |

### 1.3 关键目录

| 用途 | 路径 |
|------|------|
| 项目根 | `/Users/macmini/RonnieBach` |
| 后端代码 | `/Users/macmini/RonnieBach/server/` |
| 构建产物（被 vite preview 服务） | `/Users/macmini/RonnieBach/dist/` |
| 环境变量 | `/Users/macmini/RonnieBach/.env` |
| 环境变量模板 | `/Users/macmini/RonnieBach/.env.example` |
| 日志目录 | `~/Library/Logs/RonnieBach/` |
| 健康检查脚本 | `~/Library/Scripts/RonnieBach/healthcheck.sh` |
| 健康检查日志 | `~/.openclaw/workspace/memory/healthcheck-failures.log` |
| Cloudflare 凭证 | `~/.cloudflared/1db7396c-71ee-4507-bc9b-76790215aa4d.json` |
| Cloudflare 配置 | `~/.cloudflared/config.yml` |

---

## 2. 日常检查

### 2.1 快速健康检查（5 条命令）

```bash
# 1. 端到端访问
curl -s -o /dev/null -w "ronniebach.club: %{http_code}\n" --max-time 10 https://ronniebach.club
curl -s -o /dev/null -w "api.ronniebach.club: %{http_code}\n" --max-time 10 https://api.ronniebach.club/api/health

# 2. 本地端口
lsof -nP -iTCP:3001 -sTCP:LISTEN | tail -1
lsof -nP -iTCP:5173 -sTCP:LISTEN | tail -1

# 3. 进程
launchctl list | grep -E "ronniebach|cloudflare|mongodb"

# 4. 系统资源
df -h / | tail -1
ps aux | grep -E "node|mongod|cloudflared" | grep -v grep | awk '{print $1, $2, $3, $4, $11}'
```

### 2.2 launchd 服务状态

```bash
# 列出所有相关服务
launchctl list | grep -E "ronniebach|cloudflare|mongodb"

# 单个服务详细
launchctl print gui/$(id -u)/com.ronniebach.api
launchctl print gui/$(id -u)/com.ronniebach.web
launchctl print gui/$(id -u)/homebrew.mxcl.cloudflared
launchctl print gui/$(id -u)/homebrew.mxcl.mongodb-community
launchctl print gui/$(id -u)/com.ronniebach.healthcheck
```

### 2.3 查看日志

```bash
# 后端
tail -f ~/Library/Logs/RonnieBach/api.out.log
tail -f ~/Library/Logs/RonnieBach/api.err.log

# 前端（vite preview）
tail -f ~/Library/Logs/RonnieBach/web.out.log
tail -f ~/Library/Logs/RonnieBach/web.err.log

# 健康检查
tail -f ~/.openclaw/workspace/memory/healthcheck-failures.log

# 系统级 launchd 错误
log show --predicate 'subsystem == "com.apple.launchd"' --last 1h
```

---

## 3. 代码部署

### 3.1 仅前端变更（dist/）

```bash
cd /Users/macmini/RonnieBach

# 1. 重新构建（如果代码改了）
npm run build

# 2. 重启 vite preview 让它重新加载 dist
launchctl kickstart -k gui/$(id -u)/com.ronniebach.web

# 3. 验证
sleep 3
curl -s -o /dev/null -w "ronniebach.club: %{http_code}\n" --max-time 10 https://ronniebach.club
```

### 3.2 仅后端变更（server/）

```bash
# 重启 api 服务
launchctl kickstart -k gui/$(id -u)/com.ronniebach.api

# 验证
sleep 3
curl -s -o /dev/null -w "api.ronniebach.club: %{http_code}\n" --max-time 10 https://api.ronniebach.club/api/health
```

### 3.3 package.json 变更（依赖）

```bash
cd /Users/macmini/RonnieBach

# 安装新依赖
npm install

# 重新构建前端
npm run build

# 重启前后端
launchctl kickstart -k gui/$(id -u)/com.ronniebach.api
launchctl kickstart -k gui/$(id -u)/com.ronniebach.web

# 验证
sleep 5
curl -s -o /dev/null -w "ronniebach.club: %{http_code}\n" --max-time 10 https://ronniebach.club
curl -s -o /dev/null -w "api.ronniebach.club: %{http_code}\n" --max-time 10 https://api.ronniebach.club/api/health
```

### 3.4 从 git 拉取最新代码

```bash
cd /Users/macmini/RonnieBach
git pull

# 检查 package.json 是否变了
git diff HEAD@{1} HEAD -- package.json

# 如有变化：
npm install
npm run build
launchctl kickstart -k gui/$(id -u)/com.ronniebach.api
launchctl kickstart -k gui/$(id -u)/com.ronniebach.web
```

---

## 4. 服务管理

### 4.1 启动 / 停止 / 重启

```bash
# 单个服务
launchctl kickstart gui/$(id -u)/com.ronniebach.api      # 启动
launchctl kill SIGTERM gui/$(id -u)/com.ronniebach.api    # 优雅停止
launchctl kill SIGKILL gui/$(id -u)/com.ronniebach.api    # 强制杀
launchctl kickstart -k gui/$(id -u)/com.ronniebach.api    # 重启（先 kill 再 kickstart）

# mongod
brew services restart mongodb-community

# cloudflared
launchctl kickstart -k gui/$(id -u)/homebrew.mxcl.cloudflared
```

### 4.2 临时禁用（bootout/bootstrap）

```bash
# 禁用（不自动重启）
launchctl bootout gui/$(id -u)/com.ronniebach.api

# 重新启用
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.ronniebach.api.plist

# 验证
launchctl print gui/$(id -u)/com.ronniebach.api | head -10
```

### 4.3 完全清理某个进程（端口被占排查）

如果端口被占且 launchctl 显示异常，可以**手动杀进程**：

```bash
# 1. 找到占用端口的 PID
lsof -nP -iTCP:3001 -sTCP:LISTEN -t

# 2. 杀掉
kill -9 $(lsof -nP -iTCP:3001 -sTCP:LISTEN -t)

# 3. 等几秒
sleep 5

# 4. 让 launchd 重新接管
launchctl kickstart gui/$(id -u)/com.ronniebach.api
```

**注意**：launchd 可能会因之前多次启动失败而进入 throttle 状态。如果 kickstart 失败，等 10 秒（ThrottleInterval）再试。

---

## 5. tunnel 管理（cloudflared）

### 5.1 配置位置

```
~/.cloudflared/config.yml          # 主配置
~/.cloudflared/cert.pem            # Cloudflare Origin 证书
~/.cloudflared/<TUNNEL_ID>.json    # Tunnel 凭证
```

### 5.2 当前配置

```yaml
tunnel: 1db7396c-71ee-4507-bc9b-76790215aa4d  # ronnie-mac
credentials-file: /Users/macmini/.cloudflared/1db7396c-71ee-4507-bc9b-76790215aa4d.json

ingress:
  - hostname: ronniebach.club
    service: http://127.0.0.1:5173        # vite preview
  - hostname: api.ronniebach.club
    service: http://127.0.0.1:3001        # express API
  - service: http_status:404
```

### 5.3 修改后重启

```bash
# 1. 验证语法
cloudflared tunnel ingress validate

# 2. 重启
launchctl kickstart -k gui/$(id -u)/homebrew.mxcl.cloudflared

# 3. 等待重新握手（首次请求可能 2-4 秒）
sleep 10

# 4. 测试
curl -s -o /dev/null -w "%{http_code}\n" --max-time 30 https://ronniebach.club
```

### 5.4 tunnel 信息查询

```bash
# 列出 tunnels
cloudflared tunnel list

# 单个 tunnel 详情
cloudflared tunnel info ronnie-mac
# 或用 UUID
cloudflared tunnel info 1db7396c-71ee-4507-bc9b-76790215aa4d
```

### 5.5 故障码速查

| 状态码 | 含义 | 排查 |
|--------|------|------|
| 502 | Origin 连接失败 | 端口未监听 / 进程死了 / tunnel 还没握手 |
| 530 | Origin DNS error | tunnel 与 Cloudflare 之间握手未完成，等待或重启 cloudflared |
| 521 | Origin refused | cloudflared 配置的端口无服务在听 |
| 523 | Origin unreachable | 端口不通 |

---

## 6. 数据库管理

### 6.1 连接

```bash
mongosh "mongodb://127.0.0.1:27017/ronnie_portfolio"
# 或带认证（如果设置了）：
mongosh "mongodb://ronnie:PASSWORD@127.0.0.1:27017/ronnie_portfolio?authSource=admin"
```

### 6.2 备份

```bash
# 全量备份
mongodump \
  --uri "mongodb://127.0.0.1:27017/ronnie_portfolio" \
  --gzip \
  --archive=/Users/macmini/backups/ronnie-$(date +%Y%m%d-%H%M%S).gz

# 单集合备份
mongoexport \
  --uri="mongodb://127.0.0.1:27017/ronnie_portfolio" \
  --collection=posts \
  --out=/Users/macmini/backups/posts-$(date +%Y%m%d).json
```

### 6.3 恢复

```bash
mongorestore \
  --uri "mongodb://127.0.0.1:27017/ronnie_portfolio" \
  --gzip \
  --archive=/Users/macmini/backups/ronnie-20260902.gz \
  --drop
```

### 6.4 mongod 服务管理

```bash
brew services list | grep mongo          # 状态
brew services restart mongodb-community  # 重启
brew services stop mongodb-community     # 停止
brew services start mongodb-community    # 启动

# 配置文件：/opt/homebrew/etc/mongod.conf
# 数据目录（默认）：/opt/homebrew/var/mongodb
# 日志（默认）：/opt/homebrew/var/log/mongodb/mongo.log
```

---

## 7. 健康检查

### 7.1 健康检查脚本

脚本：`~/Library/Scripts/RonnieBach/healthcheck.sh`  
调用：launchd `com.ronniebach.healthcheck`，每天 **8:00 和 13:00 北京时间** 触发（`StartCalendarInterval`）  
日志：`~/.openclaw/workspace/memory/healthcheck-failures.log`

**调度变更历史:**
- 2026-09-02 之前：每 30 分钟一次（StartInterval 1800）
- 2026-10-13 08:35：每 5 分钟一次（StartInterval 300）
- 2026-10-13 11:00：每天 8:00 和 13:00 北京时间（StartCalendarInterval）

### 7.2 手动运行

```bash
bash ~/Library/Scripts/RonnieBach/healthcheck.sh
echo "exit: $?"
# 0 = 健康
# 1 = 有故障
```

### 7.3 立即查看下次运行时间

```bash
launchctl print gui/$(id -u)/com.ronniebach.healthcheck | grep -E "StartCalendarInterval|state"
```

### 7.4 跳过 debounce 强制重新通知

```bash
rm -f ~/.openclaw/workspace/memory/.ronniebach-last-failure-notified
```

### 7.5 健康检查覆盖项（2026-10-13 共 8 项）

1. 公网前端 `https://ronniebach.club`
2. 公网后端 `https://api.ronnnbach.club/api/dishes`
3. cloudflared 进程
4. com.ronnnbach.api 进程（3001 端口）
5. com.ronnnbach.web 进程（5173 端口）
6. mongod 进程（27017 端口）
7. 磁盘使用率（>80% 警告）
8. cloudflared 版本（< 2026.7.0 警告；维护在脚本顶部 CLOUDFLARED_MIN_VERSION）

### 7.6 通知渠道

- iMessage 收件人：`ronnie.liu1@icloud.com`（脚本顶部 IMSG_TO）
- debounce：60 分钟（同故障不重复告警）
- 故障恢复时发 1 条 ✅ 通知
- imsg 工具失败时回退到本地 log（不影响功能）

---

## 8. 故障排查

### 8.1 网站 502

```bash
# 1. 端口检查
lsof -nP -iTCP:5173 -sTCP:LISTEN    # 前端
lsof -nP -iTCP:3001 -sTCP:LISTEN    # 后端

# 2. 如端口空，手动启动
launchctl kickstart gui/$(id -u)/com.ronniebach.web
launchctl kickstart gui/$(id -u)/com.ronniebach.api

# 3. 查看错误日志
tail -20 ~/Library/Logs/RonnieBach/web.err.log
tail -20 ~/Library/Logs/RonnieBach/api.err.log

# 4. 检查 tunnel 状态
cloudflared tunnel info ronnie-mac
```

### 8.2 网站 530

```bash
# cloudflared 还没握手完，等待 10-20 秒
sleep 15

# 如仍 530：
launchctl kickstart -k gui/$(id -u)/homebrew.mxcl.cloudflared
sleep 15

curl -s -o /dev/null -w "%{http_code}\n" --max-time 30 https://ronniebach.club
```

**如果持续 530 + log 中有 `TLS handshake with edge error: EOF`**：

这通常是 cloudflared 版本过期（DNS 解析到非 Cloudflare 网段的 IP）。检查并升级：

```bash
# 1. 查看版本
cloudflared --version

# 2. 如 < 当前月份-3，应升级
brew upgrade cloudflared

# 3. 重启
launchctl kickstart -k gui/$(id -u)/homebrew.mxcl.cloudflared
sleep 20

# 4. 验证
cloudflared tunnel list    # 应显示 CONNECTIONS 列非空
curl -s -o /dev/null -w "%{http_code}\n" --max-time 20 https://ronniebach.club
```

**历史案例:** 2026-10-13 — cloudflared 2026.2.0 过期 8 个月，TLS 握手全部 EOF（IP 解析到 198.18.0.x）。升级到 2026.10.0 立即恢复。

### 8.3 网站 521 / 523

cloudflared 配置的本地端口没服务在听：

```bash
# 查看配置
cat ~/.cloudflared/config.yml

# 确认对应端口在听
lsof -nP -iTCP:5173 -sTCP:LISTEN
lsof -nP -iTCP:3001 -sTCP:LISTEN

# 启动服务
launchctl kickstart gui/$(id -u)/com.ronniebach.web
launchctl kickstart gui/$(id -u)/com.ronniebach.api
```

### 8.4 后端日志持续报 MongoDB 连接错误

```bash
# 1. 检查 mongod
brew services list | grep mongo
lsof -nP -iTCP:27017 -sTCP:LISTEN

# 2. 重启 mongod
brew services restart mongodb-community

# 3. 重启后端
launchctl kickstart -k gui/$(id -u)/com.ronniebach.api

# 4. 验证
sleep 5
curl -s http://127.0.0.1:3001/api/health | jq .
```

### 8.5 邮件发送失败

```bash
# 1. 检查 .env 是否配置
cat /Users/macmini/RonnieBach/.env

# 2. 手动测试
curl -X POST http://127.0.0.1:3001/api/notifications/email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com","subject":"test","body":"hello"}'

# 3. 看后端日志
tail -30 ~/Library/Logs/RonnieBach/api.err.log
tail -30 ~/Library/Logs/RonnieBach/api.out.log

# 4. 常见错误
# - "SMTP_USER / SMTP_PASS 未在 .env 配置"：编辑 .env 后重启
# - "EAUTH"：QQ 邮箱授权码错误或过期，需重新生成
# - "ECONNECTION"：可能被防火墙阻挡，检查
```

### 8.6 磁盘空间不足

```bash
# 1. 查看占用
df -h /
du -sh /Users/macmini/RonnieBach/node_modules

# 2. 清理
launchctl kill SIGKILL gui/$(id -u)/com.ronniebach.api
rm -rf /Users/macmini/RonnieBach/node_modules
npm install

launchctl kickstart gui/$(id -u)/com.ronniebach.api
```

### 8.7 launchctl 显示进程异常（PID `-` 但服务在跑）

见 [已知问题 #1](#11-已知问题)。

### 8.8 敏感路径返回 404（不是 200）

**背景:** 2026-10-13 安全审计发现 5661 次访问中有 5000+ 次来自自动化扫描器（`.env` / `.git` / `.ssh` / `@fs` / actuator 等路径）。原本这些路径会走 SPA fallback 返回 `index.html`（HTTP 200），虽然不泄露数据，但会让扫描器误判"路径存在"从而继续穷举，浪费 tunnel 带宽并污染日志。

**已实施:** 两处拦截，规则一致：

| 位置 | 作用范围 |
|------|---------|
| `vite.config.ts` → `blockSensitivePaths()` 插件 | 5173（`ronniebach.club`），覆盖 `configureServer` + `configurePreviewServer` |
| `server/index.js` → `BLOCKED_PATTERNS` 中间件 | 3001（`api.ronniebach.club`），放在 `express.static` **之前** |

Express 侧放在 `express.static` 之前是刻意的：即使 `dist/` 内误放了 `.env` 之类文件也会被挡下。

**黑名单规则**（两处必须同步维护）：

```js
/^\/\./                                  // 所有点开头
/^\/@fs\//                               // Vite 专用路径
/\.(pem|key|p12|pfx|jks|keystore)$/i
/\/id_(rsa|dsa|ecdsa|ed25519)$/
/\.(php|asp|aspx|jsp|cgi|pl)$/i
/^\/actuator(\/|$)/                      // Spring Boot
/^\/console(\/|$)/                       // Ruby/Rails
/^\/__debug__(\/|$)/
/^\/wp-(json|content|includes|admin)(\/|$)/
/^\/vendor\/phpunit(\/|$)/
/^\/server-(status|info)$/
/^\/(swagger|openapi|api-docs)\.json$/
```

**验证:**

```bash
# 应返回 404
curl -s -o /dev/null -w "%{http_code}\n" https://ronniebach.club/.env
curl -s -o /dev/null -w "%{http_code}\n" https://ronniebach.club/.git/config
curl -s -o /dev/null -w "%{http_code}\n" https://ronniebach.club/@fs/.env

# 应返回 200（SPA 路由未受影响）
curl -s -o /dev/null -w "%{http_code}\n" https://ronniebach.club/blog
curl -s -o /dev/null -w "%{http_code}\n" https://ronniebach.club/admin
```

**注意:** `/admin` 是本项目真实路由（管理后台），**不在黑名单内**，不要误加。

### 8.9 健康检查脚本不可用

```bash
# 手动运行看错误
bash ~/Library/Scripts/RonnieBach/healthcheck.sh

# 检查 plist 路径是否正确
cat ~/Library/LaunchAgents/com.ronniebach.healthcheck.plist | grep -A 2 ProgramArguments

# 如脚本路径变了，更新 plist
launchctl bootout gui/$(id -u)/com.ronniebach.healthcheck
# 编辑 plist 后：
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.ronniebach.healthcheck.plist
```

---

## 9. 紧急响应

### 9.1 完整宕机

```bash
# 1. 检查基础服务
brew services list | grep -E "mongo|cloud"
launchctl list | grep -E "ronniebach|cloudflare"

# 2. 启动 mongod
brew services start mongodb-community

# 3. 启动 cloudflared
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/homebrew.mxcl.cloudflared.plist
launchctl kickstart gui/$(id -u)/homebrew.mxcl.cloudflared

# 4. 启动 web + api
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.ronniebach.web.plist
launchctl kickstart gui/$(id -u)/com.ronniebach.web
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.ronniebach.api.plist
launchctl kickstart gui/$(id -u)/com.ronniebach.api

# 5. 等 30 秒
sleep 30

# 6. 端到端验证
curl -s -o /dev/null -w "ronniebach.club: %{http_code}\n" --max-time 30 https://ronniebach.club
curl -s -o /dev/null -w "api.ronniebach.club: %{http_code}\n" --max-time 30 https://api.ronniebach.club/api/health
```

### 9.2 凭据疑似泄露（QQ 邮箱授权码）

```bash
# 1. 在 QQ 邮箱设置 → 账户 → 关闭旧授权码、生成新授权码

# 2. 更新本机 .env
nano /Users/macmini/RonnieBach/.env
# 修改 SMTP_PASS

# 3. 重启后端（让 .env 重新加载）
launchctl kickstart -k gui/$(id -u)/com.ronniebach.api

# 4. 测试邮件
curl -X POST http://127.0.0.1:3001/api/notifications/email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com","subject":"test","body":"hello"}'

# 5. 检查 git 历史（如果之前误提交过授权码）
cd /Users/macmini/RonnieBach
git log --all -p | grep -i "授权码\|authorization\|AUTH_CODE" | head -5
# 如发现，需要 BFG Repo-Cleaner 或 git filter-branch 重写历史
```

### 9.3 数据库被误删

```bash
# 立即停止服务
launchctl kill SIGKILL gui/$(id -u)/com.ronniebach.api

# 从备份恢复
mongorestore \
  --uri "mongodb://127.0.0.1:27017/ronnie_portfolio" \
  --gzip \
  --archive=/Users/macmini/backups/ronnie-XXXXXX.gz \
  --drop

# 重启服务
launchctl kickstart gui/$(id -u)/com.ronniebach.api
```

### 9.4 Cloudflare Tunnel 凭证失效

```bash
# 1. 登录 Cloudflare Dashboard
# 2. 找到 tunnel ronnie-mac → Configure → Reset Token
# 3. 下载新凭证
# 4. 替换本机凭证文件
# 备份旧：
cp ~/.cloudflared/1db7396c-71ee-4507-bc9b-76790215aa4d.json ~/.cloudflared/1db7396c-...json.bak
# 放入新凭证（同名）
# 5. 重启 cloudflared
launchctl kickstart -k gui/$(id -u)/homebrew.mxcl.cloudflared
```

---

## 10. 凭据轮换

| 凭据 | 频率 | 操作 |
|------|------|------|
| QQ 邮箱授权码 (SMTP_PASS) | 季度 / 疑似泄露 | QQ 邮箱设置 + 更新 .env + 重启 |
| Cloudflare Tunnel 凭证 | 凭证失效时 | 见 9.4 |
| Mac 登录密码 | 按 Apple 政策 | 系统设置 |

MongoDB 当前**未设密码**（127.0.0.1:27017 仅本地访问），无需轮换。

---

## 11. 已知问题

### 11.1 launchctl list 显示 com.ronniebach.api 的 PID 为 `-`

**现象**：

```bash
$ launchctl list | grep com.ronniebach
com.ronniebach.api | PID=- | Status=1
```

但实际进程在跑（lsof 能看到 3001 在听）。

**原因（推测）**：

launchd 进入过多次启动失败循环（EADDRINUSE），即使后来成功启动，launchctl list 的 PID 列也仍显示历史状态。`launchctl print` 显示 `active count = 1` 表示实际有进程。

**影响**：

- ✅ 服务功能不受影响
- ⚠️ `healthcheck.sh` 用 `launchctl list | awk` 提取 PID，PID 为 `-` 时被 `grep -v '^-'` 过滤，**误报** `api-svc=DOWN`

**临时缓解**：

```bash
# 确认服务真的在跑
lsof -nP -iTCP:3001 -sTCP:LISTEN
```

**永久修复**：

修改 `healthcheck.sh` 中的 APIRUN 提取逻辑：

```bash
# 旧（受 launchd 显示 quirk 影响）
APIRUN=$(launchctl list 2>/dev/null | awk '$3=="com.ronniebach.api"{print $1}' | grep -v '^-' | head -1)

# 新（直接看端口）
APIRUN=$(lsof -nP -iTCP:3001 -sTCP:LISTEN -t 2>/dev/null | head -1)
```

类似地可以替换 WEBRUN / MONGORUN 的检测方式。

### 11.2 homebrew node 路径失效（已修复 2026-09-02）

**历史**：

plist 中的 node 路径是 `/opt/homebrew/opt/node/bin/node`（基于 Homebrew node 公式），但 Homebrew node 公式被卸载。当前 node 在 `/usr/local/bin/node`（macOS 官方 installer）。

**修复**：

两个 plist（`com.ronniebach.api` 和 `com.ronniebach.web`）已更新为 `/usr/local/bin/` 路径。

**预防**：

如果未来重装 Homebrew node 并希望恢复 plist 路径，记得同步更新两个 LaunchAgent plist。

### 11.3 首次启动 / 重启后首次访问慢

**现象**：

cloudflared 重启后第一次 `curl https://ronniebach.club` 可能 2-4 秒，之后 < 1 秒。

**原因**：

tunnel 与 Cloudflare 边缘的连接握手需要时间。

**缓解**：

```bash
# 重启 cloudflared 后主动探活
launchctl kickstart -k gui/$(id -u)/homebrew.mxcl.cloudflared
sleep 15
curl -s -o /dev/null -w "" --max-time 30 https://ronniebach.club  # 预热
```

---

## 附录 A. plist 文件模板

`~/Library/LaunchAgents/com.ronniebach.api.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>EnvironmentVariables</key>
    <dict>
        <key>MONGO_URL</key>
        <string>mongodb://localhost:27017</string>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>PORT</key>
        <string>3001</string>
    </dict>
    <key>KeepAlive</key>
    <dict>
        <key>Crashed</key>
        <true/>
        <key>SuccessfulExit</key>
        <false/>
    </dict>
    <key>Label</key>
    <string>com.ronniebach.api</string>
    <key>LimitLoadToSessionType</key>
    <array>
        <string>Aqua</string>
        <string>Background</string>
    </array>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/macmini/RonnieBach/server/index.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/Users/macmini/Library/Logs/RonnieBach/api.err.log</string>
    <key>StandardOutPath</key>
    <string>/Users/macmini/Library/Logs/RonnieBach/api.out.log</string>
    <key>ThrottleInterval</key>
    <integer>10</integer>
    <key>WorkingDirectory</key>
    <string>/Users/macmini/RonnieBach/server</string>
</dict>
</plist>
```

`~/Library/LaunchAgents/com.ronniebach.web.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    </dict>
    <key>KeepAlive</key>
    <dict>
        <key>Crashed</key>
        <true/>
        <key>SuccessfulExit</key>
        <false/>
    </dict>
    <key>Label</key>
    <string>com.ronniebach.web</string>
    <key>LimitLoadToSessionType</key>
    <array>
        <string>Aqua</string>
        <string>Background</string>
    </array>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/npx</string>
        <string>--no-install</string>
        <string>vite</string>
        <string>preview</string>
        <string>--host</string>
        <string>127.0.0.1</string>
        <string>--port</string>
        <string>5173</string>
        <string>--strictPort</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/Users/macmini/Library/Logs/RonnieBach/web.err.log</string>
    <key>StandardOutPath</key>
    <string>/Users/macmini/Library/Logs/RonnieBach/web.out.log</string>
    <key>ThrottleInterval</key>
    <integer>10</integer>
    <key>WorkingDirectory</key>
    <string>/Users/macmini/RonnieBach</string>
</dict>
</plist>
```

---

## 附录 B. 命令速查

```bash
# 服务
launchctl kickstart -k gui/$(id -u)/com.ronniebach.api       # 重启后端
launchctl kickstart -k gui/$(id -u)/com.ronniebach.web       # 重启前端
launchctl kickstart -k gui/$(id -u)/homebrew.mxcl.cloudflared  # 重启 tunnel
brew services restart mongodb-community                       # 重启 mongo

# 状态
launchctl list | grep -E "ronniebach|cloudflare|mongodb"
lsof -nP -iTCP:3001 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
lsof -nP -iTCP:27017 -sTCP:LISTEN

# 数据库
mongosh "mongodb://127.0.0.1:27017/ronnie_portfolio"
mongodump --uri "mongodb://127.0.0.1:27017/ronnie_portfolio" --gzip --archive=backup.gz

# 日志
tail -f ~/Library/Logs/RonnieBach/api.err.log
tail -f ~/Library/Logs/RonnieBach/web.err.log
tail -f ~/.openclaw/workspace/memory/healthcheck-failures.log

# 部署
cd /Users/macmini/RonnieBach
npm run build
launchctl kickstart -k gui/$(id -u)/com.ronniebach.web

# 系统
df -h /
ps aux | grep -E "node|mongod|cloudflared" | grep -v grep
```

---

*文档维护：随项目演进持续更新。修改时请保留"最后更新"日期。*