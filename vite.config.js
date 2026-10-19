import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// "base" must match the GitHub repository name.
export default defineConfig({
  base: '/mission-health/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Mission Health',
        short_name: 'Mission Health',
        description: 'Provider reference for the Edmonton mission health advisors',
        theme_color: '#1f4e5a',
        background_color: '#f6f4ef',
        display: 'standalone',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg}'], maximumFileSizeToCacheInBytes: 4 * 1024 * 1024 },
    }),
  ],
});
