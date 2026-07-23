import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/icon.svg',
        'manifest.json',
      ],
      manifest: {
        name: 'Boon — Biomedical Waste Intelligence',
        short_name: 'Boon',
        description: 'India\'s integrated biomedical waste management platform with QR tracking, blockchain verification, and CPCB-compliant reporting.',
        start_url: '/',
        display: 'standalone',
        background_color: '#030712',
        theme_color: '#059669',
        orientation: 'portrait-primary',
        lang: 'en-IN',
        categories: ['health', 'business', 'utilities'],
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/localhost:8000\/api\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'boon-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https?:\/\/localhost:3000\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'boon-app-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  // ── Vitest configuration ──────────────────────────────────────────
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: false,
  },
})
