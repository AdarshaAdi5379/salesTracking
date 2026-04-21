import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Keep /api in the path
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('➡️  Proxying:', req.method, req.url, '→', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('⬅️  Response:', proxyRes.statusCode, 'for', req.url);
          });
        },
      },
      '/salesapi': {
        target: 'https://pooja.edubricz.space',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path, // Keep /salesapi in the path
      }
    }
  }
})

