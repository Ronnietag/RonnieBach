import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
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
