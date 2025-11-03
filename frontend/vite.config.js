

import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    hmr: {
        clientPort: 8080,
    },
    watch: {
        usePolling: true
    },
    allowedHosts: [
        'unconstrued-cayden-nonrealistically.ngrok-free.dev'
    ],
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true,
      },

      '/ws': {
        target: 'ws://backend:3000',
        ws: true,
      },
    }
  }
});