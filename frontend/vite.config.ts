import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  server: {
    port: 5173,
	host: '0.0.0.0',
	allowedHosts: [
    'throatiest-unsymphoniously-leticia.ngrok-free.dev'
	],
    proxy: {
      '/ws': {
        target: 'ws://backend:3000',
        ws: true,
      },
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true
      }
    }
  }
});
