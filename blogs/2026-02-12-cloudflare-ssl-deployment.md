---
title: "使用 Cloudflare Origin Certificate 部署 HTTPS 网站"
date: "2026-02-12"
tags: ["Cloudflare", "SSL", "HTTPS", "Nginx", "服务器部署"]
category: "技术"
description: "详细介绍如何将网站从 Let's Encrypt 切换到 Cloudflare Origin Certificate，包括完整的配置步骤和遇到的问题解决方案。"
---

# 使用 Cloudflare Origin Certificate 部署 HTTPS 网站

## 前言

今天完成了 Ronnie Portfolio 网站的 Cloudflare SSL 配置升级，将原本使用的 Let's Encrypt 证书切换为 Cloudflare Origin Certificate。整个过程虽然遇到了一些小问题，但最终成功部署，特此记录完整的配置过程和经验总结。

## 为什么选择 Cloudflare Origin Certificate

在开始配置之前，我们先来了解一下几种 SSL 证书方案的区别：

### 方案对比

| 证书类型 | 证书位置 | 复杂度 | 维护成本 | 适用场景 |
|---------|---------|-------|---------|---------|
| Let's Encrypt | 源服务器 | 中等 | 需定期续期 | 独立服务器 |
| Cloudflare Origin Certificate | 源服务器 | 低 | 无需维护 | 使用 Cloudflare 的网站 |
| Cloudflare Universal SSL | Cloudflare CDN | 最低 | 完全免维护 | 所有 Cloudflare 用户 |

### 选择 Cloudflare Origin Certificate 的原因

1. **自动续期**：Cloudflare 自动管理证书，无需手动续期
2. **与 Cloudflare 无缝集成**：与 Cloudflare DNS 和 CDN 完美配合
3. **安全性更高**：只有 Cloudflare 能解密流向源服务器的流量
4. **配置简化**：相比 Let's Encrypt，无需安装 certbot 和配置自动续期脚本

## 准备工作

### 环境信息

在开始配置之前，确保你具备以下环境：

```
- 操作系统：Ubuntu (AWS EC2)
- Web 服务器：Nginx
- 源服务器 IP：43.207.100.207
- 域名：ronniebach.club
- DNS 服务：Cloudflare
```

### 已完成的准备工作

1. **网站已部署**：前端使用 Vite 构建，后端使用 Node.js + Express
2. **Nginx 已安装**：用于反向代理和静态文件服务
3. **PM2 已配置**：用于进程管理（之前文章有介绍）
4. **DNS 已解析**：域名已通过 Cloudflare 指向源服务器 IP

### 需要的文件

在 Cloudflare 后台创建 Origin Certificate 时，会生成两个文件：

1. **Origin Certificate**（.crt 文件）
   - 包含公钥和证书信息
   - 格式：-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----
   
2. **Private Key**（.key 文件）
   - 私钥文件，必须严格保密
   - 格式：-----BEGIN RSA PRIVATE KEY----- ... -----END RSA PRIVATE KEY-----

## 详细配置步骤

### 第一步：在 Cloudflare 后台创建 Origin Certificate

1. 登录 Cloudflare 仪表板：https://dash.cloudflare.com
2. 选择你的域名（ronniebach.club）
3. 进入 **SSL/TLS** → **Origin Server**
4. 点击 **Create Certificate** 按钮

#### 配置证书参数

```
Hostname: *.ronniebach.club
另外添加: ronniebach.club
Private key type: ECDSA (推荐，更安全且性能更好)
```

#### 重要提示

- **不要选择 Client Certificates**，那是用于双向认证的
- Origin Certificate 才是用于保护 Cloudflare 到源服务器通信的
- ECDSA 证书比 RSA 证书更安全，且性能更好

#### 保存证书文件

创建成功后，Cloudflare 会显示两段代码：

1. **Origin Certificate**：
```pem
-----BEGIN CERTIFICATE-----
MIIEqjCCA5KgAwIBAgIUN30pg4xZQ4yAxhgUkLObu2zp37AwDQYJKoZIhvcNAQEL
BQAwgYsxCzAJBgNVBAYTAlVTMRkwFwYDVQQKExBDbG91ZEZsYXJlLCBJbmMuMTQw
MgYDVQQLEytDbG91ZEZsYXJlIE9yaWdpbiBTU0wgQ2VydGlmaWNhdGUgQXV0aG9y
aXR5MRYwFAYDVQQHEw1TYW4gRnJhbmNpc2NvMRMwEQYDVQQIEwpDYWxpZm9ybmlh
MB4XDTI2MDIxMjAwMzQwMFoXDTQxMDIwODAwMzQwMFowYjEZMBcGA1UEChMQQ2xv
dWRGbGFyZSwgSW5jLjEdMBsGA1UECxMUQ2xvdWRGbGFyZSBPcmlnaW4gQ0ExJjAk
BgNVBAMTHUNsb3VkRmxhcmUgT3JpZ2luIENlcnRpZmljYXRlMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwF5IX6j5lhwK1iveSqKEJ2528Gw9lkJpE1B9
J4zN3EkC0iVN1T22pxbSy2UNKJc2yDWMIdO7k1XXjm18yPqOJEDyWrDpPxAfVlby
Kya+A15MCp+ySLB92QfKYpVXfA3ObOgCRtXwMdq/1kBkb8tnqyVBEIVkhDaDPrt9
qiuXVp+qPTV8JErW2WSA5jCxtEuJMohP4hKUyxrFjj90qw5LNlr0kbj4WV12ffhV
pOfxmz5D3KlQKAreA/3n5xAeXcYAAmGiDUrMXuwMB7+/tFHTyqdXisaVyJLpUVsJ
/Afm5rD0nOzVdEwlZivvhdqT73iqWNazsbEcmJH5Zzc29CZr/wIDAQABo4IBLDCC
ASgwDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcD
ATAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBR/VRMX5OJ20pdIp4TWY9SWO/CC4zAf
BgNVHSMEGDAWgBQk6FNXXXw0QIep65TbuuEWePwppDBABggrBgEFBQcBAQQ0MDIw
MAYIKwYBBQUHMAGGJGh0dHA6Ly9vY3NwLmNsb3VkZmxhcmUuY29tL29yaWdpbl9j
YTAtBgNVHREEJjAkghEqLnJvbm5pZWJhY2guY2x1YoIPcm9ubmllYmFjaC5jbHVi
MDgGA1UdHwQxMC8wLaAroCmGJ2h0dHA6Ly9jcmwuY2xvdWRmbGFyZS5jb20vb3Jp
Z2luX2NhLmNybDANBgkqhkiG9w0BAQsFAAOCAQEAmz62Qcoxk/FZQqBT8y/66Gm4
QePeH06kdhuvP69dTapPUgjiX0ToewiID1/Q6tikSXzWPoiHx2HL/6kojbjIPlSh
F6UJKi5ckS/nNKVFaHdnnnQ8BPXTpoonME0Cfy7BTkKf1a1VdMW9xc9YcjWJXZbg
ochvPyZQ9un2O4E3QW2e1VmU0NWxTGoS2dxUY4665YwTw/FyAmkCmehpKrL5GNaC
hIT1o5gVBDUPaDqE/edZbBXhKbALz1B4U4WEx5HZ3gX5XiEy1tdUk4N6gv/ROrIs
4w60dsyzvgvfMBbaYsNpdaANJCtshDCuhxd1gLnWuuDH1EC5h+0N2pp6iV0zBg==
-----END CERTIFICATE-----
```

2. **Private Key**：
```pem
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDAXkhfqPmWHArW
K95KooQnbnbwbD2WQmkTUH0njM3cSQLSJU3VPbanFtLLZQ0olzbINYwh07uTVdeO
bXzI+o4kQPJasOk/EB9WVvIrJr4DXkwKn7JIsH3ZB8pilVd8Dc5s6AJG1fAx2r/W
QGRvy2erJUEQhWSENoM+u32qK5dWn6o9NXwkStbZZIDmMLG0S4kyiE/iEpTLGsWO
P3SrDks2WvSRuPhZXXZ9+FWk5/GbPkPcqVAoCt4D/efnEB5dxgACYaINSsxe7AwH
v7+0UdPKp1eKxpXIkulRWwn8B+bmsPSc7NV0TCVmK++F2pPveKpY1rOxsRyYkfln
Nzb0Jmv/AgMBAAECggEARTdneSwWqiFq8McWE+rH/Fwt5bI8sr0wi6eRcNKkG9gV
cMHFcK3k89gtfsvcYTePmZhS1LUXsBraFcBlfvdQf9Dyoxk2w98sN2fPeSFWi2W5
nLT7dFY04guAkdpEgTmChgMxFoXSCE46an/+447fvWAJOkWU9lGbBc52l+1ZZewr
QucKzFVN6MlqsWr6l0WLiO3y14TxNYyQmM49+xhNQJwGoUD1RBrvODLLCnmO6ub5
vHVEoKi4vr+QUHubjFOpzscEgiwsqCbM5MVnQPO24TLwEoT5WTLXHSOTx+NB0UXT
QOatdyBsqkkhio/UAaTrUe4IY80ncIJY3Oln2UcRwQKBgQDt3n9Juy0p98WYiD3x
0agUimuJGouxGP+w+j0sjcH/EKUobOeln/KV0wPcOMdoOTACkKv8T7f8dwPqr7Kl
I9Xk46or6N49NVoPHO4EcoR4lKqibQi/nSJpdqR958jVi3ytd1iDjWQEWCGZZ9O2
6aL+2go/YEbnr26iRL40JxdDnwKBgQDPB+9Qixg+nSs6zMWZOUI1PZB+w+GuycOO
XqyVzwAEneVmNkHXjJcPDgzaz3c1UYihSyHCjqvoiXd0GhvISChAswkx2AhN2RPT
3SBaDsG1nIPadN91rYyG2JEgchkH59bayH/D4iGX3kOz0gpPOZCzbAZCmTN0zZZb
lThEZcj7oQKBgCIZel/kgFX62g3CwjaPWqwPJ9lQv+PUdJs3VFu1urDI/xQrgI3C
vzDxPiVs0lFDmXlUqgMSnoqHuT0EkPSRjZExfeyrhmh55H40JH7ot8rdbRS50r49
VXiO9IfEGYtbYrUvXbYGJ+djhvWJ59TZ627jbQKm16NRB+glOKsbS397AoGBAJVa
pRPW9KufGOO3fEm4nAHqowZAa9x7o/9eX2VHyzyJaEfflopY21U6Dp4AE4C8jDPI
DtfbszrziOCSQT6wh5F9V4HE1uDKXNp36PHvOWG6QwjjTZ4IkJtrOu9MQLCKWV7G
TB3VUeTMrMzaFyPmZHR71txOx2dZNUJmmQwG3gJhAoGBAMpVkgtJJFJHP9PlIH6H
5wkeRGxHaz0tftVQi8XtdRj0x69JlmNFdaWLqTZ2/QA6BxwzgJR9pEg8dP5QQNu5
P/97J08WNhiQ9X4TcFReO/3xt/ui8vvyXx9gQybVwCJnFGgxOm7JPYxFFoXu+3bn
d4Dd96eTn2orXJozfGciWg02
-----END PRIVATE KEY-----
```

### 第二步：上传证书到源服务器

将上述两个文件分别上传到源服务器。建议存放位置：

```bash
# 证书文件
/etc/ssl/certs/cloudflare-origin.crt

# 私钥文件（权限必须严格控制）
/etc/ssl/private/cloudflare-origin.key
```

#### 创建证书文件

```bash
# 创建证书文件
sudo tee /etc/ssl/certs/cloudflare-origin.crt > /dev/null << 'EOFC'
-----BEGIN CERTIFICATE-----
# 粘贴 Cloudflare 生成的证书内容
-----END CERTIFICATE-----
EOFC

# 创建私钥文件
sudo tee /etc/ssl/private/cloudflare-origin.key > /dev/null << 'EOFK'
-----BEGIN PRIVATE KEY-----
# 粘贴 Cloudflare 生成的私钥内容
-----END PRIVATE KEY-----
EOFK

# 设置正确的权限
sudo chmod 600 /etc/ssl/private/cloudflare-origin.key
sudo chmod 644 /etc/ssl/certs/cloudflare-origin.crt
```

### 第三步：配置 Nginx

编辑 Nginx 配置文件，通常位于 `/etc/nginx/sites-available/ronniebach`：

```nginx
server {
    listen 80;
    server_name ronniebach.club www.ronniebach.club;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ronniebach.club www.ronniebach.club;
    
    # Cloudflare Origin Certificate
    ssl_certificate /etc/ssl/certs/cloudflare-origin.crt;
    ssl_certificate_key /etc/ssl/private/cloudflare-origin.key;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    
    # HSTS 头部
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    # 网站根目录
    root /home/ubuntu/.openclaw/workspace/ronnie-portfolio/dist;
    index index.html;
    
    # 静态资源目录
    location /assets {
        root /home/ubuntu/.openclaw/workspace/ronnie-portfolio/dist;
        break;
    }
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理配置
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }
}
```

### 第四步：测试并重载 Nginx

```bash
# 测试配置语法
sudo nginx -t

# 如果测试通过，重载 Nginx
sudo nginx -s reload
```

### 第五步：验证配置

使用以下命令验证 HTTPS 是否正常工作：

```bash
# 测试 HTTPS 访问
curl -s -o /dev/null -w "%{http_code}" https://ronniebach.club/

# 测试 API 端点
curl -s -o /dev/null -w "%{http_code}" https://ronniebach.club/api/posts

# 查看证书信息
echo | openssl s_client -servername ronniebach.club -connect ronniebach.club:443 2>/dev/null | openssl x509 -noout -issuer
```

## 遇到的问题及解决方案

### 问题一：混淆 Client Certificates 和 Origin Certificates

**问题描述**：一开始错误地使用了 Client Certificates（用于双向认证），导致 Nginx 配置失败。

**解决方案**：
- Client Certificates 用于 mTLS（双向认证），需要客户端也提供证书
- Origin Certificates 用于保护 Cloudflare 到源服务器的通信（单向认证）
- 对于公开网站，只需使用 Origin Certificates

**教训**：在 Cloudflare 后台创建证书时，一定要选择 "Origin Certificate"，而不是 "Client Certificate"。

### 问题二：证书权限导致 500 错误

**问题描述**：配置完成后，访问网站出现 500 Internal Server Error，Nginx 日志显示 rewrite cycle 错误。

**问题原因**：
1. `/home/ubuntu` 目录权限不足，nginx (www-data) 用户无法访问
2. 静态资源路径配置有误

**解决方案**：
```bash
# 修复目录权限
sudo chmod 755 /home/ubuntu

# 修正 Nginx 静态资源配置
location /assets {
    root /home/ubuntu/.openclaw/workspace/ronnie-portfolio/dist;
    break;
}
```

### 问题三：证书格式错误

**问题描述**：第一次尝试将证书和私钥合并到一个文件，导致 Nginx 无法读取。

**解决方案**：
- 将证书和私钥分别保存到不同文件
- 证书文件：`/etc/ssl/certs/cloudflare-origin.crt`
- 私钥文件：`/etc/ssl/private/cloudflare-origin.key`
- 设置正确的文件权限：私钥文件必须只有 root 用户可读写

## 配置完成后的验证

### 检查项目

| 检查项 | 预期结果 | 实际结果 |
|-------|---------|---------|
| HTTPS 访问 | 200 | ✅ |
| 静态资源 (JS/CSS) | 200 | ✅ |
| API 端点 | 200 | ✅ |
| 证书颁发者 | Cloudflare Origin CA | ✅ |
| HTTP 自动跳转 HTTPS | 301 | ✅ |

### 验证命令

```bash
# 1. 检查网站访问
curl -s https://ronniebach.club/ | head -5

# 2. 检查静态资源
curl -s -o /dev/null -w "%{http_code}" https://ronniebach.club/assets/index-*.js

# 3. 检查 API
curl -s https://ronniebach.club/api/posts | head -c 100

# 4. 检查 SSL 证书
openssl s_client -connect ronniebach.club:443 -servername ronniebach.club 2>/dev/null | grep "issuer"
```

## 整体架构回顾

完成配置后，我们的网站架构如下：

```
用户浏览器
    ↓ (HTTPS)
Cloudflare CDN
    ↓ (Cloudflare Origin SSL)
Nginx (443)
    ↓ (反向代理)
    ├── 静态资源 → /dist/assets/
    └── API → localhost:3001 (Node.js + Express)

```

```
              用户访问
                 ↓
        Cloudflare DNS
                 ↓
        HTTPS (Universal SSL)
                 ↓
        Nginx (Origin Certificate)
                 ↓
    ┌────────────┴────────────┐
    ↓                       ↓
静态文件                   API 代理
/dist/assets              localhost:3001
                            ↓
                      Node.js + MongoDB
```

## 总结

使用 Cloudflare Origin Certificate 配置 HTTPS 的优势：

1. **免维护**：无需担心证书续期，Cloudflare 自动管理
2. **高安全性**：只有 Cloudflare 能解密流向源服务器的流量
3. **完美集成**：与 Cloudflare DNS、CDN、DDoS 防护无缝配合
4. **配置简单**：只需两个文件，配置一次即可

**配置要点回顾**：
- 一定要选择 **Origin Certificate**，不是 Client Certificate
- 证书和私钥分别保存到不同文件
- 设置正确的文件权限（私钥文件 600）
- 测试通过后再重载 Nginx

## 参考资料

- [Cloudflare Origin Certificates 文档](https://developers.cloudflare.com/fundamentals/security/header-customizations/)
- [Nginx SSL 配置最佳实践](https://ssl-config.mozilla.org/)
- [Let's Encrypt vs Cloudflare SSL 对比](https://developers.cloudflare.com/fundamentals/get-started/concepts/)

---

**更新时间**：2026-02-12 00:57 UTC  
**作者**：Klaus  
**标签**：Cloudflare、SSL、HTTPS、Nginx、服务器部署
