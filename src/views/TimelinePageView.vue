<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TimelineView from '@/components/Timeline/TimelineView.vue'
import TimelineFilter from '@/components/Timeline/TimelineFilter.vue'
import EventForm from '@/components/EventForm/EventForm.vue'
import EventDeleteConfirm from '@/components/EventForm/EventDeleteConfirm.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useEventStore } from '@/stores/eventStore'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { exportNodeToImage, buildExportFilename } from '@/services/exportService'
import type { LifeEvent } from '@/types'

const eventStore = useEventStore()
const userStore = useUserStore()
const uiStore = useUiStore()

onMounted(() => {
  void eventStore.loadEvents()
})

// 编辑事件弹窗（本页专用，新增走全局）
const editFormOpen = ref(false)
const editingEvent = ref<LifeEvent | null>(null)

// 删除确认状态
const deleteOpen = ref(false)
const deletingEvent = ref<LifeEvent | null>(null)

// 导出图片状态
const exportArea = ref<HTMLElement | null>(null)
const exporting = ref(false)
const exportError = ref<string | null>(null)

function openAdd() {
  uiStore.openEventForm()
}

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
  if (deletingEvent.value) {
    await eventStore.deleteEvent(deletingEvent.value.id)
  }
  deleteOpen.value = false
  deletingEvent.value = null
}

async function handleExport() {
  if (!exportArea.value || exporting.value) return
  exporting.value = true
  exportError.value = null
  try {
    await exportNodeToImage(exportArea.value, {
      filename: buildExportFilename(userStore.user, 'timeline'),
      format: 'png',
      pixelRatio: 2,
    })
  } catch (err) {
    exportError.value = err instanceof Error ? err.message : '导出失败，请重试'
    setTimeout(() => { exportError.value = null }, 3000)
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto animate-fade-in">
    <!-- 可导出区域 -->
    <div ref="exportArea">
      <!-- 页头 -->
      <div class="px-4 sm:px-6 pt-8 pb-2 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100">
            我的人生时间线
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            每一个节点都是你人生的一部分 ✨
          </p>
        </div>

        <AppButton
          v-if="eventStore.totalCount > 0"
          variant="ghost"
          size="sm"
          class="flex-shrink-0 mt-1"
          :disabled="exporting"
          :title="exporting ? '正在生成图片…' : '导出时间线为图片'"
          @click="handleExport"
        >
          <span v-if="exporting" class="animate-pulse">⏳ 导出中…</span>
          <span v-else>📷 导出图片</span>
        </AppButton>
      </div>

      <div
        v-if="exportError"
        class="mx-4 sm:mx-6 mt-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400"
      >
        ⚠️ {{ exportError }}
      </div>

      <div v-if="eventStore.totalCount > 0" class="px-4 sm:px-6 mt-4">
        <TimelineFilter />
      </div>

      <TimelineView @add="openAdd" @edit="onEdit" @delete="onDelete" />
    </div>

    <!-- 浮动添加按钮 -->
    <button
      type="button"
      class="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary-400 hover:bg-primary-500 text-white text-2xl shadow-warm flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-30"
      title="添加事件"
      aria-label="添加事件"
      @click="openAdd"
    >
      ＋
    </button>

    <!-- 编辑事件弹窗（本页专用） -->
    <AppModal
      v-model="editFormOpen"
      title="编辑事件"
      max-width="max-w-lg"
      @close="onEditCancel"
    >
      <EventForm
        :existing="editingEvent"
        @saved="onEditSaved"
        @cancel="onEditCancel"
      >
        <template #delete>
          <AppButton
            variant="ghost"
            type="button"
            class="!text-red-500"
            @click="() => { editFormOpen = false; onDelete(editingEvent!); }"
          >
            🗑️ 删除
          </AppButton>
        </template>
      </EventForm>
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
