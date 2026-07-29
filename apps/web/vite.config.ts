import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { playwright } from '@vitest/browser-playwright'

const API_MODE = process.env.VITE_API_MODE ?? 'mock'

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: path.resolve(__dirname, 'routes'),
      generatedRouteTree: path.resolve(__dirname, 'routeTree.gen.ts'),
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'lpg.svg'],
      manifest: {
        name: 'CSPH — Gestion de flotte',
        short_name: 'CSPH',
        description: 'Console de gestion de flotte CSPH',
        theme_color: '#0f766e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: '/index.html',
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 5173,
    // Proxy only when the app talks to a relative /api base (default/dev/prod).
    // mock (direct :8787) and fake (in-browser) need no proxy.
    proxy:
      API_MODE === 'mock' || API_MODE === 'fake'
        ? undefined
        : {
            '/api': {
              target: process.env.VITE_API_URL ?? 'http://localhost:8787',
              changeOrigin: true,
            },
          },
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        {
          browser: 'chromium',
          headless: true,
        },
      ],
    },
    include: ['**/*.test.{ts,tsx}'],
  },
})
