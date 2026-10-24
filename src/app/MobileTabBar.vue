<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ChartColumn, History, ListTodo, Settings, UserRound } from 'lucide-vue-next'
import { useUserStore } from '@/stores/userStore'

const route = useRoute()
const userStore = useUserStore()

const tabs = [
  { name: '时间线', to: '/', icon: History },
  { name: '列表', to: '/list', icon: ListTodo },
  { name: '统计', to: '/stats', icon: ChartColumn },
  { name: '档案', to: '/profile', icon: UserRound },
  { name: '设置', to: '/settings', icon: Settings },
]

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/' || route.path === '/timeline'
  return route.path.startsWith(to)
}
</script>

<template>
  <nav
    v-if="userStore.isLoggedIn"
    class="fixed inset-x-0 bottom-0 z-40 border-t border-app-border bg-app-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    aria-label="主导航"
  >
    <div class="grid grid-cols-5">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        :class="[
          'flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
          isActive(tab.to) ? 'text-app-accent' : 'text-app-ink-faint',
        ]"
        :aria-current="isActive(tab.to) ? 'page' : undefined"
      >
        <component :is="tab.icon" :size="20" :stroke-width="isActive(tab.to) ? 2.1 : 1.7" />
        {{ tab.name }}
      </RouterLink>
    </div>
  </nav>
</template>
