import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // expose dev server on LAN so other devices can access via network URL
    host: '0.0.0.0', // Écouter sur toutes les interfaces réseau
    port: 5173,
    strictPort: true, // Échouer si le port n'est pas disponible
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
  },
  // Améliorer la configuration pour le développement en réseau
  define: {
    __DEV__: true
  },
  // Optimisations pour le développement réseau
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})
