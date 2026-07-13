import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'LPG Driver App',
        short_name: 'Driver',
        description: 'LPG Fleet Driver App',
        theme_color: '#ffffff',
      }
    })
  ]
})
