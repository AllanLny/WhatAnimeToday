import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // expose dev server on LAN so other devices can access via network URL
    host: true,
    port: 5173,
    // Proxy API calls to the local backend so network clients don't call their own localhost
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // keep the /api prefix (backend expects it)
        rewrite: (path) => path
      }
    }
  }
})
