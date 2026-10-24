<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import AppHeader from '@/app/AppHeader.vue'
import MobileTabBar from '@/app/MobileTabBar.vue'
import ToastHost from '@/components/ui/ToastHost.vue'
import AppModal from '@/components/common/AppModal.vue'
import EventForm from '@/components/EventForm/EventForm.vue'
import { useUiStore } from '@/stores/uiStore'
import { useGlobalShortcuts } from '@/composables/useGlobalShortcuts'

const uiStore = useUiStore()
const router = useRouter()

useGlobalShortcuts()

async function onFormSaved() {
  uiStore.closeEventForm()
  // 等待弹窗关闭动画完成后再跳转,避免与路由过渡冲突导致新页面不渲染
  await new Promise(resolve => setTimeout(resolve, 50))
  // 从统计/档案等页面记录后回到时间线;时间线本身就在当前页
  if (!['/', '/timeline'].includes(router.currentRoute.value.path)) {
    await router.replace('/')
  }
}

function onFormCancel() {
  uiStore.closeEventForm()
}
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

    <!-- 全局记录弹窗(P4 将替换为 QuickCapture 快速记录) -->
    <AppModal
      :model-value="uiStore.showEventForm"
      title="添加事件"
      max-width="max-w-lg"
      @update:model-value="(v: boolean) => { if (!v) uiStore.closeEventForm() }"
      @close="onFormCancel"
    >
      <EventForm
        :existing="null"
        @saved="onFormSaved"
        @cancel="onFormCancel"
      />
    </AppModal>
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
