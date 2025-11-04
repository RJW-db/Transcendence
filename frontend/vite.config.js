

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
        // 'unconstrued-cayden-nonrealistically.ngrok-free.dev'
        'kanesha-surmisable-unintrudingly.ngrok-free.dev/'
    ],
    proxy: {

      '/ws': {
        target: 'ws://backend:3000',
        ws: true,
      },
    }
  }
});