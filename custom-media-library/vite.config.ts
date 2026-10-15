import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The CE.SDK assets must come from the page's own origin: the custom Elements
// panel copies the editor stylesheet's rules, which the browser blocks for a
// cross-origin stylesheet. In development, Vite passes `/cesdk-assets/` through
// to the IMG.LY CDN. In production, serve the assets yourself (see README).
const CESDK_CDN = 'https://cdn.img.ly/packages/imgly/cesdk-js/1.84.0/assets';

export default defineConfig({
  plugins: [react()],
  build: { target: 'es2022' },
  server: {
    proxy: {
      '/cesdk-assets': {
        target: CESDK_CDN,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cesdk-assets/, '')
      }
    }
  }
});
