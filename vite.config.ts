import { defineConfig, type Plugin } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 项目站点部署在子路径 /LifeLine/ 下；开发服务器仍从根路径提供。
// 自定义域名时可设 BASE_PATH=/ 覆盖。
const basePath = process.env.BASE_PATH ?? '/LifeLine/'

// GitHub Pages 项目站点没有 SPA 回退：直接访问 /timeline 等子路由会 404。
// 官方做法是复制 index.html 为 404.html，应用加载后由 vue-router 按当前 URL 恢复路由。
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    closeBundle() {
      const outDir = fileURLToPath(new URL('./dist', import.meta.url))
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? basePath : '/',
  plugins: [vue(), ...(command === 'build' ? [spaFallback()] : [])],
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
