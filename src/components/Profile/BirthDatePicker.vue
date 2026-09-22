<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { calcAge, formatChineseDate, fromPrecisionInputValue } from '@/utils/dateUtils'

interface Props {
  /** ISO 日期字符串（受控值）；空串表示未选择 */
  modelValue: string
  invalid?: boolean
  inputId?: string
}

const props = withDefaults(defineProps<Props>(), {
  invalid: false,
  inputId: 'birth-date',
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const now = new Date()
const currentYear = now.getFullYear()

const selectedYear = ref<number | null>(null)
const selectedMonth = ref<number | null>(null)
const selectedDay = ref<number | null>(null)

/** 是否正在由外部受控值回填，避免回填时又向外发射 */
let syncingFromProp = false

function parseIso(iso: string): { y: number; m: number; d: number } | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }
}

function syncFromProp(iso: string) {
  const parsed = parseIso(iso)
  syncingFromProp = true
  try {
    selectedYear.value = parsed?.y ?? null
    selectedMonth.value = parsed?.m ?? null
    selectedDay.value = parsed?.d ?? null
  } finally {
    syncingFromProp = false
  }
}

watch(() => props.modelValue, syncFromProp, { immediate: true })

const years = computed(() => {
  const list: number[] = []
  for (let y = currentYear; y >= 1900; y--) list.push(y)
  return list
})

const months = computed(() => Array.from({ length: 12 }, (_, i) => i + 1))

const daysInMonth = computed(() => {
  if (!selectedYear.value || !selectedMonth.value) return 31
  // 月初下个月第 0 天即本月最后一天
  return new Date(selectedYear.value, selectedMonth.value, 0).getDate()
})

const days = computed(() => Array.from({ length: daysInMonth.value }, (_, i) => i + 1))

// 年月变化后，若已选的日超出当月天数则收敛（如 2 月只有 28/29 天）
watch([selectedYear, selectedMonth], () => {
  if (selectedDay.value !== null && selectedDay.value > daysInMonth.value) {
    selectedDay.value = daysInMonth.value
  }
  emitIfComplete()
})

function onDayChange() {
  emitIfComplete()
}

function emitIfComplete() {
  if (syncingFromProp) return
  if (selectedYear.value && selectedMonth.value && selectedDay.value) {
    const iso = fromPrecisionInputValue(
      `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(selectedDay.value).padStart(2, '0')}`,
      'day',
    )
    if (iso && iso !== props.modelValue) emit('update:modelValue', iso)
  } else if (props.modelValue !== '') {
    // 未选全时清空受控值，让父级校验拦截而不是提交一个残缺日期
    emit('update:modelValue', '')
  }
}

function clearAll() {
  selectedYear.value = null
  selectedMonth.value = null
  selectedDay.value = null
  if (props.modelValue !== '') emit('update:modelValue', '')
}

const isComplete = computed(() => !!props.modelValue)

const previewText = computed(() => {
  if (!props.modelValue) return ''
  const formatted = formatChineseDate(props.modelValue, 'day')
  const age = calcAge(props.modelValue)
  const date = new Date(props.modelValue)
  const weekday = Number.isNaN(date.getTime())
    ? ''
    : ` · 星期${['日', '一', '二', '三', '四', '五', '六'][date.getDay()]}`
  return `${formatted} · ${age} 岁${weekday}`
})

const selectClass = (hasError: boolean) =>
  [
    'input-base appearance-none pr-8 text-center text-base py-2.5 cursor-pointer',
    hasError ? '!border-red-400 !ring-red-400' : '',
  ].join(' ')
</script>

<template>
  <fieldset>
    <legend class="sr-only">出生日期</legend>
    <div class="grid grid-cols-[1.4fr_1fr_1fr] gap-2 sm:gap-3">
      <div>
        <label :for="`${inputId}-year`" class="mb-1.5 block text-center text-xs text-gray-500 dark:text-gray-400">年</label>
        <select
          :id="`${inputId}-year`"
          v-model.number="selectedYear"
          :class="selectClass(invalid && !selectedYear)"
          aria-label="出生年份"
        >
          <option :value="null" disabled>年份</option>
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
      <div>
        <label :for="`${inputId}-month`" class="mb-1.5 block text-center text-xs text-gray-500 dark:text-gray-400">月</label>
        <select
          :id="`${inputId}-month`"
          v-model.number="selectedMonth"
          :class="selectClass(invalid && !selectedMonth)"
          aria-label="出生月份"
        >
          <option :value="null" disabled>月份</option>
          <option v-for="m in months" :key="m" :value="m">{{ m }} 月</option>
        </select>
      </div>
      <div>
        <label :for="`${inputId}-day`" class="mb-1.5 block text-center text-xs text-gray-500 dark:text-gray-400">日</label>
        <select
          :id="`${inputId}-day`"
          v-model.number="selectedDay"
          :class="selectClass(invalid && !selectedDay)"
          aria-label="出生日期"
          @change="onDayChange"
        >
          <option :value="null" disabled>日期</option>
          <option v-for="d in days" :key="d" :value="d">{{ d }} 日</option>
        </select>
      </div>
    </div>

    <div class="mt-2.5 flex min-h-5 items-center justify-between gap-2 text-sm">
      <p v-if="isComplete" class="truncate text-primary-500" aria-live="polite">
        🎂 {{ previewText }}
      </p>
      <p v-else class="text-xs text-gray-400">
        先选年份，再选月、日 —— 不用来回翻几十年的日历
      </p>
      <button
        v-if="selectedYear || selectedMonth || selectedDay"
        type="button"
        class="shrink-0 text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline dark:hover:text-gray-300"
        @click="clearAll"
      >
        清空
      </button>
    </div>
  </fieldset>
</template>
