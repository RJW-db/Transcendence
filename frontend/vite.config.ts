import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  server: {
    port: 5173,
	host: '0.0.0.0',
	allowedHosts: [
        'nondeprecatory-hyperexcursively-laverna.ngrok-free.dev'
		// 'unconstrued-cayden-nonrealistically.ngrok-free.dev'
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
