
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import FullReload from 'vite-plugin-full-reload';

const ngrokDomain = process.env.NGROK_SITE 
  ? process.env.NGROK_SITE.replace(/https?:\/\//, '') 
  : undefined;

export default defineConfig({
  root: './',
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: ngrokDomain ? [ngrokDomain] : [],
    proxy: {
      '/ws': {
        target: 'ws://backend:3000',
        ws: true,
      },
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true
      }
    },
    watch: {
      // Watch for changes in the html directory and trigger full reload
      ignored: ['!**/html/**'],
    },
  },
  plugins: [
    tailwindcss(),
    FullReload(["./html/**/*.html"]),
  ]
});

