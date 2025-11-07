import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  server: {
    port: 5173,
	host: '0.0.0.0',
	allowedHosts: [
        'kanesha-surmisable-unintrudingly.ngrok-free.dev'
	],
    proxy: {
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
