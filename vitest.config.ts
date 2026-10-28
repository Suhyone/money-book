import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // เทสต์ส่วนใหญ่ไม่ต้องใช้ DOM จึงใช้ node ให้เร็ว (ไฟล์ไหนต้องใช้ใส่ // @vitest-environment jsdom)
      environment: 'node',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
