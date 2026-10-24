<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Camera, Sparkles } from 'lucide-vue-next'
import VirtualTimeline from '@/components/Timeline/VirtualTimeline.vue'
import TimelineFilter from '@/components/Timeline/TimelineFilter.vue'
import EventFormPanel from '@/components/event/EventFormPanel.vue'
import LifeTemplatePicker from '@/components/event/LifeTemplatePicker.vue'
import EventDeleteConfirm from '@/components/EventForm/EventDeleteConfirm.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useEventStore } from '@/stores/eventStore'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { useToast } from '@/composables/useToast'
import { exportNodeToImage, buildExportFilename } from '@/services/exportService'
import { UNDO_DELETE_WINDOW_MS } from '@/utils/constants'
import type { LifeEvent } from '@/types'

const eventStore = useEventStore()
const userStore = useUserStore()
const uiStore = useUiStore()
const toast = useToast()

onMounted(() => {
  void eventStore.loadEvents()
})

// ============ 页头统计 ============
const yearSpan = computed(() => {
  const sorted = eventStore.sortedEvents
  if (sorted.length === 0) return ''
  const first = new Date(sorted[0].date).getFullYear()
  const last = new Date(sorted[sorted.length - 1].date).getFullYear()
  return first === last ? `${first} 年` : `${first} – ${last} 年`
})

// ============ 编辑弹窗(新增走全局) ============
const editFormOpen = ref(false)
const editingEvent = ref<LifeEvent | null>(null)

// ============ 人生模板选择器 ============
const templatePickerOpen = ref(false)

async function onConfirmDraft(event: LifeEvent) {
  try {
    await eventStore.confirmDraft(event.id)
    toast.success(`「${event.title}」已确认`)
  } catch {
    toast.error('确认失败,请重试')
  }
}

// ============ 删除确认 + 撤销 ============
const deleteOpen = ref(false)
const deletingEvent = ref<LifeEvent | null>(null)
let undoTimer: ReturnType<typeof setTimeout> | null = null

function onEdit(event: LifeEvent) {
  editingEvent.value = event
  editFormOpen.value = true
}

function onEditSaved() {
  editFormOpen.value = false
  editingEvent.value = null
}

function onEditCancel() {
  editFormOpen.value = false
  editingEvent.value = null
}

function onDelete(event: LifeEvent) {
  deletingEvent.value = event
  deleteOpen.value = true
}

async function confirmDelete() {
  const target = deletingEvent.value
  deleteOpen.value = false
  deletingEvent.value = null
  if (!target) return
  try {
    await eventStore.deleteEvent(target.id)
    if (undoTimer) clearTimeout(undoTimer)
    const toastId = toast.withAction(
      `已删除「${target.title}」`,
      {
        label: '撤销',
        handler: () => {
          if (undoTimer) clearTimeout(undoTimer)
          void eventStore.undoDelete().catch(() => {})
        },
      },
    )
    undoTimer = setTimeout(() => {
      eventStore.dismissRecentlyDeleted()
      toast.dismiss(toastId)
    }, UNDO_DELETE_WINDOW_MS)
  } catch {
    toast.error(eventStore.error ?? '删除失败,请重试')
  }
}

// ============ 导出当前视图 ============
const exportArea = ref<HTMLElement | null>(null)
const exporting = ref(false)

async function handleExport() {
  if (!exportArea.value || exporting.value) return
  exporting.value = true
  try {
    await exportNodeToImage(exportArea.value, {
      filename: buildExportFilename(userStore.user, 'timeline'),
      format: 'png',
      pixelRatio: 2,
    })
    toast.success('已导出当前视图')
  } catch (err) {
    toast.error(err instanceof Error ? err.message : '导出失败,请重试')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-6xl animate-fade-in">
    <div ref="exportArea">
      <!-- 页头 -->
      <header class="flex items-end justify-between gap-4 px-4 pb-4 pt-8 sm:px-6">
        <div>
          <p class="text-[10px] font-medium tracking-[0.35em] text-app-accent">
            MY LIFE TIMELINE
          </p>
          <h1 class="mt-1.5 font-display text-3xl font-bold text-app-ink">
            我的人生
          </h1>
          <p class="mt-1 text-sm text-app-ink-soft">
            {{ eventStore.totalCount }} 条记录<template v-if="yearSpan"> · {{ yearSpan }}</template>
          </p>
        </div>
        <div class="flex flex-shrink-0 items-center gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            title="从人生模板生成草稿"
            @click="templatePickerOpen = true"
          >
            <Sparkles :size="14" />
            <span class="hidden sm:inline">模板</span>
          </AppButton>
          <AppButton
            v-if="eventStore.totalCount > 0"
            variant="ghost"
            size="sm"
            class="flex-shrink-0"
            :disabled="exporting"
            :title="exporting ? '正在生成图片…' : '导出时间线为图片'"
            @click="handleExport"
          >
            <Camera :size="15" />
            {{ exporting ? '导出中…' : '导出图片' }}
          </AppButton>
        </div>
      </header>

      <!-- 筛选 -->
      <div v-if="eventStore.totalCount > 0" class="px-4 pb-4 sm:px-6">
        <TimelineFilter />
      </div>

      <!-- 时间线 -->
      <VirtualTimeline
        @add="uiStore.openEventForm()"
        @templates="templatePickerOpen = true"
        @edit="onEdit"
        @delete="onDelete"
        @confirm="onConfirmDraft"
      />
    </div>

    <!-- 人生模板选择器 -->
    <LifeTemplatePicker
      v-model="templatePickerOpen"
      @close="templatePickerOpen = false"
    />

    <!-- 浮动记录按钮 -->
    <button
      type="button"
      class="fixed bottom-20 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-app-accent text-white shadow-warm transition-all hover:brightness-95 active:scale-95 md:bottom-6 md:right-6"
      title="添加事件"
      aria-label="添加事件"
      @click="uiStore.openEventForm()"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>

    <!-- 编辑事件弹窗 -->
    <AppModal
      v-model="editFormOpen"
      title="编辑事件"
      max-width="max-w-lg"
      @close="onEditCancel"
    >
      <EventFormPanel
        :existing="editingEvent"
        @saved="onEditSaved"
        @cancel="onEditCancel"
      >
        <template #delete>
          <AppButton
            variant="ghost"
            type="button"
            size="sm"
            class="!text-red-500"
            @click="() => { editFormOpen = false; onDelete(editingEvent!); }"
          >
            删除
          </AppButton>
        </template>
      </EventFormPanel>
    </AppModal>

    <!-- 删除确认 -->
    <AppModal v-model="deleteOpen" title="删除事件" max-width="max-w-md">
      <EventDeleteConfirm
        v-if="deletingEvent"
        :title="deletingEvent.title"
        @confirm="confirmDelete"
        @cancel="deleteOpen = false"
      />
    </AppModal>
  </div>
</template>
