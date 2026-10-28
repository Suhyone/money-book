import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// GitHub Pages เสิร์ฟที่ /<ชื่อ repo>/ — workflow ส่ง BASE_PATH มาให้ ตอนพัฒนาในเครื่องใช้ /
const base = process.env.BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      // มีเวอร์ชันใหม่ → แสดงแถบให้ผู้ใช้กดอัปเดตเอง (ดู UpdatePrompt.vue)
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'สมุดรายรับรายจ่าย',
        short_name: 'รายรับจ่าย',
        description: 'บันทึกรายรับรายจ่าย เก็บข้อมูลในเครื่อง ใช้งานออฟไลน์ได้',
        lang: 'th',
        theme_color: '#059669',
        background_color: '#f3f5f4',
        display: 'standalone',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
