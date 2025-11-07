

import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
        // When using ngrok, HMR should connect to the ngrok domain (not localhost:5173)
        // Set clientPort to 443 for https ngrok tunnels (or 80 for http)
        host: 'nondeprecatory-hyperexcursively-laverna.ngrok-free.dev',
        protocol: 'wss',
        clientPort: 443,
    },
    watch: {
        usePolling: true
    },
    allowedHosts: [
        // 'unconstrued-cayden-nonrealistically.ngrok-free.dev'
        // 'kanesha-surmisable-unintrudingly.ngrok-free.dev/'
        'nondeprecatory-hyperexcursively-laverna.ngrok-free.dev'
    ],
    proxy: {
      '/ws': {
        target: 'ws://backend:3000',
        ws: true,
        changeOrigin: true,
      },
    }
  }
});