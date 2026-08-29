<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import AppHeader from '@/components/common/AppHeader.vue'
import AppModal from '@/components/common/AppModal.vue'
import EventForm from '@/components/EventForm/EventForm.vue'
import { useUiStore } from '@/stores/uiStore'

const uiStore = useUiStore()
const router = useRouter()

async function onFormSaved() {
  uiStore.closeEventForm()
  // 等待弹窗关闭动画完成后再跳转，避免与路由过渡冲突导致新页面不渲染
  await new Promise(resolve => setTimeout(resolve, 50))
  if (router.currentRoute.value.path !== '/timeline') {
    await router.replace('/timeline')
  }
}

function onFormCancel() {
  uiStore.closeEventForm()
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <AppHeader />

    <main class="flex-1">
      <RouterView v-slot="{ Component, route: viewRoute }">
        <Transition name="page">
          <component :is="Component" :key="viewRoute.path" />
        </Transition>
      </RouterView>
    </main>

    <footer class="border-t border-gray-200 dark:border-gray-700 py-6 mt-auto">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-gray-400">
        Life-Point · 人生时间线 — 记录生活，反思人生 ✨
      </div>
    </footer>

    <!-- 全局添加事件弹窗：任何页面均可触发，保存后跳转时间线 -->
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
