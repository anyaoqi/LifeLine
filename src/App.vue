<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/app/AppHeader.vue'
import MobileTabBar from '@/app/MobileTabBar.vue'
import ToastHost from '@/components/ui/ToastHost.vue'
import QuickCapture from '@/components/event/QuickCapture.vue'
import { useGlobalShortcuts } from '@/composables/useGlobalShortcuts'

useGlobalShortcuts()
</script>

<template>
  <div class="flex min-h-screen flex-col bg-app-bg text-app-ink">
    <AppHeader />

    <main class="flex-1 pb-20 md:pb-0">
      <RouterView v-slot="{ Component, route: viewRoute }">
        <Transition name="page">
          <component :is="Component" :key="viewRoute.path" />
        </Transition>
      </RouterView>
    </main>

    <footer class="mt-auto hidden border-t border-app-border py-6 md:block">
      <p class="text-center text-xs text-app-ink-faint">
        LifePoint · 人生纪念册 — 把值得记住的时刻留在纸上
      </p>
    </footer>

    <MobileTabBar />
    <ToastHost />

    <!-- 全局快速记录:任何页面可唤起,支持连续添加 -->
    <QuickCapture />
  </div>
</template>

<style scoped>
.page-enter-active {
  transition: opacity 0.2s ease 0.05s;
}
.page-leave-active {
  transition: opacity 0.15s ease;
  position: absolute;
  width: 100%;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
