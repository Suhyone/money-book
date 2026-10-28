import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// สร้างไอคอนทุกขนาดจาก public/logo.svg: npm run generate-icons
// โลโก้มีพื้นหลังเต็มและเว้นขอบไว้แล้ว จึงไม่ต้องเติม padding ให้ไอคอน maskable/apple
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0 },
    apple: { ...minimal2023Preset.apple, padding: 0 },
  },
  images: ['public/logo.svg'],
})
