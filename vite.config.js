import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true // Esto nos permite probar la PWA mientras programamos
      },
      manifest: {
        name: 'IronLog',
        short_name: 'IronLog',
        description: 'Diario de entrenamiento y progreso',
        theme_color: '#0f172a', // Color de la barra de estado (slate-900)
        background_color: '#020617', // Color de fondo al cargar (slate-950)
        display: 'standalone', // Hace que se vea como app nativa, sin barra de navegador
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})