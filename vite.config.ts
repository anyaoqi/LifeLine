import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 项目站点部署在子路径 /LifeLine/ 下；开发服务器仍从根路径提供。
// 自定义域名时可设 BASE_PATH=/ 覆盖。
const basePath = process.env.BASE_PATH ?? '/LifeLine/'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? basePath : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
  },
}))
