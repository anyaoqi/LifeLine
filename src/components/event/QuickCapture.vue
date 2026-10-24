<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppModal from '@/components/common/AppModal.vue'
import EventFormPanel from './EventFormPanel.vue'
import { useUiStore } from '@/stores/uiStore'
import { useToast } from '@/composables/useToast'

/**
 * 全局快速记录:任何页面 ⌘/按钮均可唤起。
 * 首屏只需标题 + 日期;「保存并继续」支持连续录入(冷启动友好)。
 */
const uiStore = useUiStore()
const toast = useToast()
const router = useRouter()

const panelRef = ref<InstanceType<typeof EventFormPanel> | null>(null)

watch(
  () => uiStore.showEventForm,
  async (open) => {
    if (open) {
      await nextTick()
      panelRef.value?.focusTitle()
    }
  },
)

function onSaved(continued: boolean) {
  if (continued) {
    toast.success('已记录,继续下一条')
    panelRef.value?.focusTitle()
    return
  }
  uiStore.closeEventForm()
  toast.success('已记录')
  // 从非时间线页记录后回到时间线
  if (!['/', '/timeline'].includes(router.currentRoute.value.path)) {
    void router.replace('/')
  }
}

function onCancel() {
  uiStore.closeEventForm()
}
</script>

<template>
  <AppModal
    :model-value="uiStore.showEventForm"
    title="添加事件"
    max-width="max-w-lg"
    @update:model-value="(v: boolean) => { if (!v) onCancel() }"
    @close="onCancel"
  >
    <EventFormPanel
      ref="panelRef"
      variant="quick"
      continuous
      @saved="onSaved"
      @cancel="onCancel"
    />
  </AppModal>
</template>
