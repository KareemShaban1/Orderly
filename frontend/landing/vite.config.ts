import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Use relative base path to support both /landing/ and /organizations/ routes
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5176,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        // Ensure service worker is copied to dist
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'sw.js') {
            return 'sw.js';
          }
          return assetInfo.name || 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  publicDir: 'public'
})

