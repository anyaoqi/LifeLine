<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useUiStore } from '@/stores/uiStore'
import { useUserStore } from '@/stores/userStore'

const uiStore = useUiStore()
const userStore = useUserStore()
const route = useRoute()

const themeIcon = computed(() => {
  switch (uiStore.theme) {
    case 'light':
      return '☀️'
    case 'dark':
      return '🌙'
    default:
      return '🖥️'
  }
})

const themeLabel = computed(() => {
  switch (uiStore.theme) {
    case 'light':
      return '浅色'
    case 'dark':
      return '深色'
    default:
      return '跟随系统'
  }
})

const navItems = computed(() => {
  const base = [{ name: '首页', to: '/' }]
  if (userStore.isLoggedIn) {
    return [
      ...base,
      { name: '时间线', to: '/timeline' },
      { name: '统计', to: '/stats' },
      { name: '档案', to: '/profile' },
      { name: '设置', to: '/settings' },
    ]
  }
  return base
})

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <header
    class="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700"
  >
    <div class="max-w-5xl mx-auto px-4 sm:px-6">
      <div class="flex items-center justify-between h-16">
        <!-- Logo + 标题 -->
        <RouterLink to="/" class="flex items-center gap-2 group">
          <span
            class="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-400 text-white text-lg shadow-warm transition-transform group-hover:scale-105"
          >
            ✦
          </span>
          <div class="flex flex-col leading-none">
            <span class="text-lg font-bold text-gray-800 dark:text-gray-100">Life-Point</span>
            <span class="text-xs text-gray-500 dark:text-gray-400">人生时间线</span>
          </div>
        </RouterLink>

        <!-- 导航 -->
        <nav class="hidden md:flex items-center gap-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :class="[
              'px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive(item.to)
                ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100',
            ]"
          >
            {{ item.name }}
          </RouterLink>
        </nav>

        <!-- 右侧操作 -->
        <div class="flex items-center gap-2">
          <!-- 主题切换 -->
          <button
            type="button"
            class="flex items-center justify-center w-9 h-9 rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            :title="`主题：${themeLabel}（点击切换）`"
            :aria-label="`切换主题，当前 ${themeLabel}`"
            @click="uiStore.cycleTheme()"
          >
            <span class="text-lg">{{ themeIcon }}</span>
          </button>

          <!-- 用户头像（移动端导航入口） -->
          <RouterLink
            v-if="userStore.isLoggedIn"
            to="/profile"
            class="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 font-medium text-sm"
            title="个人档案"
          >
            {{ userStore.userName.charAt(0).toUpperCase() }}
          </RouterLink>
        </div>
      </div>

      <!-- 移动端导航 -->
      <nav v-if="userStore.isLoggedIn" class="md:hidden flex items-center gap-1 pb-2 -mt-1 overflow-x-auto">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
            isActive(item.to)
              ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
          ]"
        >
          {{ item.name }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
