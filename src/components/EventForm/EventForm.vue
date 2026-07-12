<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import { useEventStore } from '@/stores/eventStore'
import { validateEvent } from '@/utils/validators'
import { toDateInputValue, fromDateInputValue } from '@/utils/dateUtils'
import { CATEGORIES, DEFAULT_CATEGORY } from '@/utils/constants'
import type { LifeEvent, EventCategory, EventType } from '@/types'

interface Props {
  // 传入则为编辑模式
  existing?: LifeEvent | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const eventStore = useEventStore()

const form = reactive({
  title: '',
  type: 'point' as EventType,
  date: '',
  endDate: '',
  category: DEFAULT_CATEGORY as EventCategory,
  description: '',
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)

watch(
  () => props.existing,
  (event) => {
    if (event) {
      form.title = event.title
      form.type = event.type ?? 'point'
      form.date = toDateInputValue(event.date)
      form.endDate = event.endDate ? toDateInputValue(event.endDate) : ''
      form.category = event.category
      form.description = event.description ?? ''
    }
  },
  { immediate: true }
)

// 切换为时间点时清空结束日期，避免残留无效数据
watch(
  () => form.type,
  (t) => {
    if (t === 'point') {
      form.endDate = ''
      if (errors.value.endDate) delete errors.value.endDate
    }
  }
)

async function handleSubmit() {
  const input = {
    title: form.title.trim(),
    type: form.type,
    date: fromDateInputValue(form.date),
    endDate: form.type === 'period' ? fromDateInputValue(form.endDate) : undefined,
    category: form.category,
    description: form.description.trim() || undefined,
  }
  const result = validateEvent(input)
  errors.value = result.errors
  if (!result.valid) return

  submitting.value = true
  try {
    if (props.existing) {
      await eventStore.updateEvent(props.existing.id, input)
    } else {
      await eventStore.createEvent(input)
    }
    emit('saved')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <!-- 标题 -->
    <div>
      <label for="event-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        事件标题 <span class="text-red-500">*</span>
      </label>
      <input
        id="event-title"
        v-model.trim="form.title"
        type="text"
        maxlength="50"
        class="input-base"
        placeholder="发生了什么？例如：入学、毕业、第一次旅行…"
        :class="{ '!border-red-400 !ring-red-400': errors.title }"
      />
      <p v-if="errors.title" class="mt-1 text-sm text-red-500">{{ errors.title }}</p>
    </div>

    <!-- 事件类型 -->
    <div>
      <span class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        时间类型
      </span>
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          :class="[
            'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm transition-all',
            form.type === 'point'
              ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300'
              : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
          ]"
          @click="form.type = 'point'"
        >
          <span>📌</span>
          <span class="font-medium">时间点</span>
        </button>
        <button
          type="button"
          :class="[
            'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm transition-all',
            form.type === 'period'
              ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300'
              : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
          ]"
          @click="form.type = 'period'"
        >
          <span>📅</span>
          <span class="font-medium">时间区间</span>
        </button>
      </div>
    </div>

    <!-- 日期（时间点 / 起始日期） -->
    <div>
      <label for="event-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {{ form.type === 'period' ? '起始日期' : '日期' }} <span class="text-red-500">*</span>
      </label>
      <input
        id="event-date"
        v-model="form.date"
        type="date"
        class="input-base"
        :class="{ '!border-red-400 !ring-red-400': errors.date }"
      />
      <p v-if="errors.date" class="mt-1 text-sm text-red-500">{{ errors.date }}</p>
    </div>

    <!-- 结束日期（仅时间区间事件） -->
    <div v-if="form.type === 'period'">
      <label for="event-end-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        结束日期 <span class="text-red-500">*</span>
      </label>
      <input
        id="event-end-date"
        v-model="form.endDate"
        type="date"
        class="input-base"
        :class="{ '!border-red-400 !ring-red-400': errors.endDate }"
      />
      <p v-if="errors.endDate" class="mt-1 text-sm text-red-500">{{ errors.endDate }}</p>
    </div>

    <!-- 分类 -->
    <div>
      <span class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        分类
      </span>
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.key"
          type="button"
          :class="[
            'flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border-2 text-xs transition-all',
            form.category === cat.key
              ? 'border-transparent ring-2 ring-offset-1 dark:ring-offset-gray-800'
              : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700',
          ]"
          :style="form.category === cat.key ? {
            borderColor: cat.color,
            '--tw-ring-color': cat.color,
            backgroundColor: cat.color + '20',
          } : undefined"
          @click="form.category = cat.key"
        >
          <span class="text-lg">{{ cat.emoji }}</span>
          <span
            class="font-medium"
            :style="{ color: form.category === cat.key ? cat.color : undefined }"
          >
            {{ cat.label }}
          </span>
        </button>
      </div>
    </div>

    <!-- 描述 -->
    <div>
      <label for="event-desc" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        描述
      </label>
      <textarea
        id="event-desc"
        v-model="form.description"
        rows="3"
        maxlength="500"
        class="input-base resize-none"
        placeholder="记录更多细节…（选填）"
      ></textarea>
      <p class="mt-1 text-xs text-gray-400 text-right">{{ form.description.length }} / 500</p>
      <p v-if="errors.description" class="mt-1 text-sm text-red-500">{{ errors.description }}</p>
    </div>

    <div class="flex justify-between gap-3 pt-2">
      <!-- 左侧：删除（仅编辑模式） -->
      <slot name="delete" />

      <!-- 右侧：取消 + 保存 -->
      <div class="flex gap-3 ml-auto">
        <AppButton variant="ghost" type="button" @click="emit('cancel')">取消</AppButton>
        <AppButton type="submit" :disabled="submitting">
          {{ submitting ? '保存中…' : (existing ? '保存修改' : '添加事件') }}
        </AppButton>
      </div>
    </div>
  </form>
</template>
