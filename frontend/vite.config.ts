import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  root: './',
  server: {
    port: 5173,
	host: '0.0.0.0',
	allowedHosts: [
    'unconstrued-cayden-nonrealistically.ngrok-free.dev'
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
