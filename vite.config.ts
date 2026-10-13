import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// 敏感路径黑名单：命中则返回 404，不再走 SPA fallback
// 目的：避免互联网扫描器看到 200 就继续穷举路径（浪费 tunnel 带宽 + 污染日志）
// 背景：2026-10-13 安全审计发现 5000+ 次自动化扫描（.env/.git/.ssh/@fs 等）
const BLOCKED_PATTERNS: RegExp[] = [
  /^\/\./,                        // 所有点开头：/.env /.git /.ssh /.npmrc /.htpasswd /.bashrc /.DS_Store
  /^\/@fs\//,                     // Vite 框架专用路径（/@fs/.env 等）
  /\.(pem|key|p12|pfx|jks|keystore)$/i,
  /\/id_(rsa|dsa|ecdsa|ed25519)$/,
  /\.(php|asp|aspx|jsp|cgi|pl)$/i,
  /^\/actuator(\/|$)/,
  /^\/console(\/|$)/,
  /^\/__debug__(\/|$)/,
  /^\/wp-(json|content|includes|admin)(\/|$)/,
  /^\/vendor\/phpunit(\/|$)/,
  /^\/server-(status|info)$/,
  /^\/(swagger|openapi|api-docs)\.json$/
]

function isBlocked(url: string | undefined): boolean {
  if (!url) return false
  const path = url.split('?')[0].split('#')[0]
  return BLOCKED_PATTERNS.some((re) => re.test(path))
}

function blockSensitivePaths(): Plugin {
  const middleware = (req: any, res: any, next: any) => {
    if (isBlocked(req.url)) {
      res.statusCode = 404
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('Not Found')
      return
    }
    next()
  }
  return {
    name: 'block-sensitive-paths',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    blockSensitivePaths()
  ],
  define: {
    'import.meta.env.VITE_API_BASE': JSON.stringify('https://api.ronniebach.club')
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['ronniebach.club', 'api.ronniebach.club'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
