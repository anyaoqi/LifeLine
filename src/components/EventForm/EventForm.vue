<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import PrecisionDatePicker from './PrecisionDatePicker.vue'
import { useEventStore } from '@/stores/eventStore'
import { validateEvent } from '@/utils/validators'
import { calcDuration } from '@/utils/dateUtils'
import {
  CATEGORIES,
  DATE_PRECISIONS,
  DEFAULT_CATEGORY,
  DEFAULT_DATE_PRECISION,
  DEFAULT_IMPORTANCE,
  EVENT_TYPES,
  IMPORTANCE_LEVELS,
} from '@/utils/constants'
import type { DatePrecision, EventCategory, EventType, Importance, LifeEvent, LifeEventInput } from '@/types'

interface Props {
  existing?: LifeEvent | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ saved: []; cancel: [] }>()
const eventStore = useEventStore()

// 日期统一以 ISO 字符串存于表单，选择器按精度决定形态
const form = reactive({
  title: '',
  type: 'point' as EventType,
  date: '',
  datePrecision: DEFAULT_DATE_PRECISION as DatePrecision,
  endDate: '',
  endDatePrecision: DEFAULT_DATE_PRECISION as DatePrecision,
  isOngoing: false,
  importance: DEFAULT_IMPORTANCE as Importance,
  category: DEFAULT_CATEGORY as EventCategory,
  description: '',
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)

function clearError(...keys: string[]) {
  for (const key of keys) delete errors.value[key]
}

/** 切换精度只改变选择器形态；已选日期保留，存储时按新精度裁剪 */
function setPrecision(
  precisionField: 'datePrecision' | 'endDatePrecision',
  next: DatePrecision,
) {
  form[precisionField] = next
  clearError(precisionField)
}

watch(
  () => props.existing,
  (event) => {
    if (!event) return
    form.title = event.title
    form.type = event.type ?? 'point'
    form.datePrecision = event.datePrecision ?? DEFAULT_DATE_PRECISION
    form.date = event.date ?? ''
    form.endDatePrecision = event.endDatePrecision ?? form.datePrecision
    form.endDate = event.endDate ?? ''
    form.isOngoing = event.isOngoing === true
    form.importance = event.importance ?? DEFAULT_IMPORTANCE
    form.category = event.category
    form.description = event.description ?? ''
    errors.value = {}
  },
  { immediate: true },
)

// 点事件没有结束；「至今」则与结束日期互斥。
watch(() => form.type, (type) => {
  if (type === 'point') {
    form.endDate = ''
    form.isOngoing = false
    clearError('endDate', 'endDatePrecision', 'isOngoing')
  }
})
watch(() => form.isOngoing, (isOngoing) => {
  if (isOngoing) {
    form.endDate = ''
    clearError('endDate', 'endDatePrecision')
  }
})

/** 按精度裁剪为存储值：低精度只保留时间段起点作为排序锚点 */
function truncateToPrecision(iso: string, precision: DatePrecision): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = precision === 'year' ? 0 : date.getMonth()
  const day = precision === 'day' ? date.getDate() : 1
  return new Date(year, month, day, 12, 0, 0).toISOString()
}

const durationPreview = computed(() => {
  if (form.type !== 'period' || !form.date) return ''
  const start = truncateToPrecision(form.date, form.datePrecision)
  const end = form.isOngoing ? undefined : truncateToPrecision(form.endDate, form.endDatePrecision)
  return calcDuration(start, end, form.isOngoing)
})

const isPeriod = computed(() => form.type === 'period')

async function handleSubmit() {
  const isRange = form.type === 'period' && !form.isOngoing
  const input: LifeEventInput = {
    title: form.title.trim(),
    type: form.type,
    date: truncateToPrecision(form.date, form.datePrecision),
    datePrecision: form.datePrecision,
    endDate: isRange ? truncateToPrecision(form.endDate, form.endDatePrecision) : undefined,
    endDatePrecision: isRange ? form.endDatePrecision : undefined,
    isOngoing: form.type === 'period' ? form.isOngoing : undefined,
    importance: form.importance,
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

    <!-- 时间：形态 + 精度 + 日期，聚合为一个分组，减少视觉跳跃 -->
    <fieldset class="rounded-lg border border-gray-200 dark:border-gray-700 p-3.5">
      <legend class="px-1 text-xs font-semibold text-gray-500 dark:text-gray-400">时间</legend>

      <!-- 时间点 / 区间 -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="inline-flex rounded-md bg-gray-100 dark:bg-gray-700/60 p-0.5" role="radiogroup" aria-label="事件时间类型">
          <button
            v-for="eventType in EVENT_TYPES"
            :key="eventType.key"
            type="button"
            role="radio"
            :aria-checked="form.type === eventType.key"
            :title="eventType.hint"
            :class="[
              'inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all',
              form.type === eventType.key
                ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-800 dark:text-primary-200'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
            ]"
            @click="form.type = eventType.key"
          >
            <span>{{ eventType.icon }}</span>
            <span>{{ eventType.label }}</span>
          </button>
        </div>

        <label
          v-if="isPeriod"
          class="inline-flex items-center gap-1.5 text-xs text-primary-700 dark:text-primary-200 cursor-pointer select-none"
        >
          <input v-model="form.isOngoing" type="checkbox" class="h-3.5 w-3.5 rounded border-gray-300 text-primary-500 focus:ring-primary-400" />
          至今（尚未结束）
        </label>
      </div>
      <p v-if="errors.type" class="mt-1 text-xs text-red-500">{{ errors.type }}</p>

      <!-- 起始日期 -->
      <div class="mt-3">
        <div class="flex items-center justify-between gap-2 mb-1">
          <label for="event-date" class="text-xs font-medium text-gray-600 dark:text-gray-300">
            {{ isPeriod ? '开始' : '发生时间' }} <span class="text-red-500">*</span>
          </label>
          <div class="inline-flex rounded bg-gray-100 dark:bg-gray-700/60 p-0.5" role="radiogroup" aria-label="起始日期精度">
            <button
              v-for="precision in DATE_PRECISIONS"
              :key="precision.key"
              type="button"
              :title="precision.hint"
              :aria-checked="form.datePrecision === precision.key"
              role="radio"
              :class="[
                'rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
                form.datePrecision === precision.key
                  ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-800 dark:text-primary-200'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
              ]"
              @click="setPrecision('datePrecision', precision.key)"
            >{{ precision.label }}</button>
          </div>
        </div>
        <PrecisionDatePicker
          v-model="form.date"
          input-id="event-date"
          :precision="form.datePrecision"
          :invalid="!!(errors.date || errors.datePrecision)"
          @update:model-value="clearError('date', 'datePrecision')"
        />
        <p v-if="errors.date || errors.datePrecision" class="mt-1 text-xs text-red-500">
          {{ errors.date || errors.datePrecision }}
        </p>
      </div>

      <!-- 结束日期（仅区间且未勾选至今） -->
      <div v-if="isPeriod && !form.isOngoing" class="mt-3">
        <div class="flex items-center justify-between gap-2 mb-1">
          <label for="event-end-date" class="text-xs font-medium text-gray-600 dark:text-gray-300">
            结束 <span class="text-red-500">*</span>
          </label>
          <div class="inline-flex rounded bg-gray-100 dark:bg-gray-700/60 p-0.5" role="radiogroup" aria-label="结束日期精度">
            <button
              v-for="precision in DATE_PRECISIONS"
              :key="precision.key"
              type="button"
              :title="precision.hint"
              :aria-checked="form.endDatePrecision === precision.key"
              role="radio"
              :class="[
                'rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
                form.endDatePrecision === precision.key
                  ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-800 dark:text-primary-200'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
              ]"
              @click="setPrecision('endDatePrecision', precision.key)"
            >{{ precision.label }}</button>
          </div>
        </div>
        <PrecisionDatePicker
          v-model="form.endDate"
          input-id="event-end-date"
          :precision="form.endDatePrecision"
          :min-date="form.date || undefined"
          :invalid="!!(errors.endDate || errors.endDatePrecision)"
          @update:model-value="clearError('endDate', 'endDatePrecision')"
        />
      </div>

      <p v-if="errors.endDate || errors.endDatePrecision || errors.isOngoing" class="mt-1 text-xs text-red-500">
        {{ errors.endDate || errors.endDatePrecision || errors.isOngoing }}
      </p>

      <div class="mt-2 flex flex-wrap items-center gap-2">
        <span class="text-[11px] text-gray-400">记不清具体某天时，切换上方精度即可</span>
        <span
          v-if="durationPreview"
          class="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700 dark:bg-primary-900/25 dark:text-primary-200"
        >▮ 跨度 {{ durationPreview }}</span>
      </div>
    </fieldset>

    <!-- 重要程度：紧凑分段器 -->
    <div>
      <div class="flex items-center justify-between gap-2 mb-1.5">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">重要程度</span>
        <span class="text-[11px] text-gray-400">大事会在「只看大事」中优先呈现</span>
      </div>
      <div class="flex rounded-md bg-gray-100 dark:bg-gray-700/60 p-0.5" role="radiogroup" aria-label="事件重要程度">
        <button
          v-for="item in IMPORTANCE_LEVELS"
          :key="item.level"
          type="button"
          role="radio"
          :aria-checked="form.importance === item.level"
          :title="item.desc"
          :class="[
            'flex-1 rounded px-1 py-1.5 text-[11px] font-medium transition-all',
            form.importance === item.level
              ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-800 dark:text-primary-200'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
          ]"
          @click="form.importance = item.level; clearError('importance')"
        >
          {{ item.label }}
        </button>
      </div>
      <p v-if="errors.importance" class="mt-1 text-xs text-red-500">{{ errors.importance }}</p>
    </div>

    <!-- 分类 -->
    <div>
      <span class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">分类</span>
      <div class="grid grid-cols-4 gap-1.5">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.key"
          type="button"
          :class="[
            'flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-md border text-[11px] transition-all',
            form.category === cat.key
              ? 'border-transparent font-semibold'
              : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
          ]"
          :style="form.category === cat.key ? {
            borderColor: cat.color,
            backgroundColor: cat.color + '1f',
            color: cat.color,
          } : undefined"
          @click="form.category = cat.key"
        >
          <span>{{ cat.emoji }}</span>
          <span>{{ cat.label }}</span>
        </button>
      </div>
    </div>

    <!-- 描述 -->
    <div>
      <label for="event-desc" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        描述 <span class="font-normal text-[11px] text-gray-400">（选填）</span>
      </label>
      <textarea
        id="event-desc"
        v-model="form.description"
        rows="3"
        maxlength="500"
        class="input-base resize-none"
        placeholder="记录更多细节，例如当时的心情、同行的人…"
      ></textarea>
      <p class="mt-1 text-xs text-gray-400 text-right">{{ form.description.length }} / 500</p>
      <p v-if="errors.description" class="mt-1 text-sm text-red-500">{{ errors.description }}</p>
    </div>

    <div class="flex justify-between gap-3 pt-1">
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
