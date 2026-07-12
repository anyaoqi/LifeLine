<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useUiStore } from '@/stores/uiStore'
import { useUserStore } from '@/stores/userStore'
import { useEventStore } from '@/stores/eventStore'
import { eventService, userService } from '@/services/storageService'
import { downloadExportJson, importFromFile } from '@/services/exportService'
import type { Theme } from '@/types'

const uiStore = useUiStore()
const userStore = useUserStore()
const eventStore = useEventStore()
const router = useRouter()

const clearOpen = ref(false)

// 文件输入 ref
const fileInput = ref<HTMLInputElement | null>(null)

// 导出/导入状态
const exporting = ref(false)
const importing = ref(false)
const importOpen = ref(false)
const importFileName = ref('')
const importError = ref('')
const importMessage = ref('')
let pendingFile: File | null = null

const themeOptions: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: '浅色', icon: '☀️' },
  { value: 'dark', label: '深色', icon: '🌙' },
  { value: 'auto', label: '跟随系统', icon: '🖥️' },
]

function selectTheme(t: Theme) {
  uiStore.setTheme(t)
}

// 导出数据
async function handleExport() {
  if (!userStore.userId) return
  exporting.value = true
  try {
    await downloadExportJson(userStore.userId)
  } finally {
    exporting.value = false
  }
}

// 选择导入文件
function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  pendingFile = file
  importFileName.value = file.name
  importError.value = ''
  importMessage.value = `已选择「${file.name}」，导入将覆盖当前数据。`
  importOpen.value = true

  // 重置 input 以便重复选择同一文件
  input.value = ''
}

// 确认导入
async function confirmImport() {
  if (!pendingFile) return
  importing.value = true
  importError.value = ''
  try {
    const result = await importFromFile(pendingFile, true)
    if (result.success) {
      importMessage.value = ''
      importOpen.value = false
      pendingFile = null
      importFileName.value = ''

      // 重新加载应用状态
      await userStore.initUser()
      if (userStore.isLoggedIn) {
        await eventStore.loadEvents()
      }
      // 跳转到首页以刷新视图
      router.push('/')
    } else {
      importError.value = result.error || '导入失败'
    }
  } catch (err) {
    importError.value = err instanceof Error ? err.message : '文件解析失败'
  } finally {
    importing.value = false
  }
}

// 取消导入
function cancelImport() {
  importOpen.value = false
  pendingFile = null
  importFileName.value = ''
  importError.value = ''
  importMessage.value = ''
}

async function confirmClearAll() {
  // 删除当前用户的所有事件 + 用户档案，并重置状态
  if (userStore.userId) {
    await eventService.deleteEventsByUser(userStore.userId)
    await userService.deleteUser(userStore.userId)
  }
  uiStore.clearLocalData()
  eventStore.reset()
  userStore.logout()
  clearOpen.value = false
  router.push('/')
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
    <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
      设置
    </h1>

    <!-- 主题设置 -->
    <section class="card-base p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
        外观
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        选择你喜欢的主题外观
      </p>

      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="opt in themeOptions"
          :key="opt.value"
          type="button"
          :class="[
            'flex flex-col items-center gap-2 py-4 rounded-lg border-2 transition-all',
            uiStore.theme === opt.value
              ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-600 hover:border-primary-300',
          ]"
          @click="selectTheme(opt.value)"
        >
          <span class="text-2xl">{{ opt.icon }}</span>
          <span
            class="text-sm font-medium"
            :class="uiStore.theme === opt.value ? 'text-primary-500' : 'text-gray-600 dark:text-gray-300'"
          >
            {{ opt.label }}
          </span>
        </button>
      </div>
    </section>

    <!-- 关于 -->
    <section class="card-base p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">关于</h2>
      <dl class="text-sm space-y-2">
        <div class="flex justify-between">
          <dt class="text-gray-500 dark:text-gray-400">应用名称</dt>
          <dd class="text-gray-800 dark:text-gray-200">Life-Point · 人生时间线</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-gray-500 dark:text-gray-400">版本</dt>
          <dd class="text-gray-800 dark:text-gray-200">0.2.0</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-gray-500 dark:text-gray-400">数据存储</dt>
          <dd class="text-gray-800 dark:text-gray-200">本地（IndexedDB）</dd>
        </div>
      </dl>
      <p class="mt-4 text-xs text-gray-400 italic">
        记录生活，反思人生 ✨
      </p>
    </section>

    <!-- 数据管理 -->
    <section class="card-base p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
        数据管理
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        导出你的数据用于备份，或从备份文件恢复数据
      </p>

      <div class="flex flex-wrap gap-3">
        <!-- 导出 -->
        <AppButton
          variant="secondary"
          :disabled="exporting || !userStore.isLoggedIn"
          @click="handleExport"
        >
          {{ exporting ? '导出中…' : '📤 导出数据' }}
        </AppButton>

        <!-- 导入 -->
        <label class="cursor-pointer">
          <AppButton
            variant="secondary"
            :disabled="importing || !userStore.isLoggedIn"
            type="button"
            @click="fileInput?.click()"
          >
            📥 导入数据
          </AppButton>
          <input
            ref="fileInput"
            type="file"
            accept=".json,application/json"
            class="hidden"
            @change="onFileChange"
          />
        </label>
      </div>

      <p class="mt-3 text-xs text-gray-400">
        导出格式为 JSON 文件，包含个人档案和全部 {{ eventStore.totalCount }} 个事件
      </p>
    </section>

    <!-- 危险区域 -->
    <section class="card-base p-6 border-2 border-red-100 dark:border-red-900/30">
      <h2 class="text-lg font-semibold text-red-600 dark:text-red-400 mb-1">
        清除数据
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        删除所有事件和个人档案。此操作无法撤销，请谨慎操作。
      </p>
      <AppButton variant="danger" @click="clearOpen = true">
        清除所有数据
      </AppButton>
    </section>

    <!-- 清除确认 -->
    <AppModal v-model="clearOpen" title="确认清除数据" max-width="max-w-md">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xl">
          ⚠️
        </div>
        <div>
          <p class="text-gray-700 dark:text-gray-200">
            确定要清除所有数据吗？
          </p>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            你的个人档案和全部 {{ eventStore.totalCount }} 个事件都将被永久删除，且无法恢复。
          </p>
        </div>
      </div>
      <template #footer>
        <AppButton variant="ghost" type="button" @click="clearOpen = false">取消</AppButton>
        <AppButton variant="danger" type="button" @click="confirmClearAll">确认清除</AppButton>
      </template>
    </AppModal>

    <!-- 导入确认 -->
    <AppModal v-model="importOpen" title="确认导入数据" max-width="max-w-md" @close="cancelImport">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xl">
          📥
        </div>
        <div>
          <p class="text-gray-700 dark:text-gray-200">
            {{ importMessage }}
          </p>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            导入将覆盖你当前的个人档案和所有事件，现有数据会被替换。
          </p>
          <p v-if="importError" class="mt-2 text-sm text-red-500">
            {{ importError }}
          </p>
        </div>
      </div>
      <template #footer>
        <AppButton variant="ghost" type="button" @click="cancelImport">取消</AppButton>
        <AppButton type="button" :disabled="importing" @click="confirmImport">
          {{ importing ? '导入中…' : '确认导入' }}
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
