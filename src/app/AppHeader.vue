<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { History, ListTodo, Search, Settings, Sparkle, Sun, Moon, ChartColumn, UserRound, Plus } from 'lucide-vue-next'
import IconButton from '@/components/ui/IconButton.vue'
import { useUiStore } from '@/stores/uiStore'
import { useUserStore } from '@/stores/userStore'

const uiStore = useUiStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const navItems = [
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

function focusSearch() {
  if (route.path !== '/') void router.push('/')
  uiStore.requestSearchFocus()
}
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-app-border bg-app-bg/85 backdrop-blur-md"
  >
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="flex h-14 items-center justify-between gap-3 sm:h-16">
        <!-- Logo -->
        <RouterLink to="/" class="group flex items-center gap-2.5">
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-app-accent text-white shadow-warm transition-transform group-hover:scale-105"
          >
            <Sparkle :size="15" fill="currentColor" />
          </span>
          <span class="flex flex-col leading-none">
            <span class="font-display text-lg font-bold tracking-tight text-app-ink">
              LifePoint
            </span>
            <span class="mt-0.5 hidden text-[10px] tracking-widest text-app-ink-faint sm:block">
              人生纪念册
            </span>
          </span>
        </RouterLink>

        <!-- 桌面导航 -->
        <nav class="hidden items-center gap-1 lg:flex">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :class="[
              'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive(item.to)
                ? 'bg-app-accent-soft text-app-accent'
                : 'text-app-ink-soft hover:bg-app-bg-deep hover:text-app-ink',
            ]"
          >
            <component :is="item.icon" :size="15" :stroke-width="1.8" />
            {{ item.name }}
          </RouterLink>
        </nav>

        <!-- 右侧操作 -->
        <div class="flex items-center gap-1.5 sm:gap-2">
          <!-- 搜索(桌面) -->
          <button
            type="button"
            class="hidden h-9 items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 text-sm text-app-ink-faint transition-colors hover:border-app-border-strong hover:text-app-ink-soft md:flex"
            title="搜索(快捷键 /)"
            aria-label="搜索"
            @click="focusSearch"
          >
            <Search :size="15" />
            <span>搜索</span>
            <kbd class="rounded border border-app-border bg-app-bg-deep px-1.5 text-[10px] leading-4">/</kbd>
          </button>
          <IconButton
            v-if="userStore.isLoggedIn"
            :icon="Search"
            label="搜索"
            class="md:hidden"
            @click="focusSearch"
          />

          <!-- 记录 -->
          <button
            v-if="userStore.isLoggedIn"
            type="button"
            class="hidden h-9 items-center gap-1.5 rounded-lg bg-app-accent px-3.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-95 active:scale-95 sm:inline-flex"
            title="添加事件"
            @click="uiStore.openEventForm()"
          >
            <Plus :size="16" :stroke-width="2.2" />
            记录
          </button>
          <IconButton
            v-if="userStore.isLoggedIn"
            :icon="Plus"
            label="添加事件"
            class="sm:hidden"
            @click="uiStore.openEventForm()"
          />

          <!-- 主题切换 -->
          <IconButton
            :icon="uiStore.isDark ? Sun : Moon"
            :label="uiStore.isDark ? '切换到浅色' : '切换到深色'"
            @click="uiStore.toggleTheme()"
          />
        </div>
      </div>
    </div>
  </header>
</template>
