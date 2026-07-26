<script setup lang="ts">
import { computed } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import { zhCN } from 'date-fns/locale'
import { useUiStore } from '@/stores/uiStore'
import type { DatePrecision } from '@/types'

interface Props {
  /** ISO 日期字符串（受控值）；空串表示未选择 */
  modelValue: string
  /** 记录精度：决定选择器形态（年 / 年月 / 年月日） */
  precision: DatePrecision
  placeholder?: string
  invalid?: boolean
  inputId?: string
  /** 可选的最早/最晚可选日期（ISO） */
  minDate?: string
  maxDate?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  invalid: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const uiStore = useUiStore()

/** vue-datepicker 的 month-picker 使用 { month, year }（month 从 0 开始），year-picker 使用 number */
type PickerValue = Date | { month: number; year: number } | number | null

const pickerValue = computed<PickerValue>(() => {
  if (!props.modelValue) return null
  const date = new Date(props.modelValue)
  if (Number.isNaN(date.getTime())) return null

  if (props.precision === 'year') return date.getFullYear()
  if (props.precision === 'month') return { month: date.getMonth(), year: date.getFullYear() }
  return date
})

/**
 * 统一转回 ISO。低精度按该时间段起点存储（仅作排序锚点），
 * 展示层再按精度裁剪，不会把「2016 年」显示成「2016年1月1日」。
 */
function onUpdate(value: PickerValue) {
  if (value === null || value === undefined) {
    emit('update:modelValue', '')
    return
  }

  let date: Date
  if (typeof value === 'number') {
    date = new Date(value, 0, 1, 12, 0, 0)
  } else if (value instanceof Date) {
    date = new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0)
  } else {
    date = new Date(value.year, value.month, 1, 12, 0, 0)
  }

  emit('update:modelValue', date.toISOString())
}

/** 输入框内的只读文本：与卡片/时间轴的精度展示规则保持一致 */
const inputFormat = computed(() => {
  if (props.precision === 'year') return (date: Date) => `${date.getFullYear()}年`
  if (props.precision === 'month') {
    return (date: Date) => `${date.getFullYear()}年${date.getMonth() + 1}月`
  }
  return (date: Date) => `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
})

const computedPlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder
  if (props.precision === 'year') return '选择年份'
  if (props.precision === 'month') return '选择年月'
  return '选择具体日期'
})

const inputClass = computed(() =>
  props.invalid ? 'lp-datepicker-input lp-datepicker-input--invalid' : 'lp-datepicker-input',
)
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- 图标置于输入框外，避免与 placeholder 重叠 -->
    <span
      class="flex-shrink-0 text-base leading-none text-gray-400 dark:text-gray-500"
      aria-hidden="true"
    >📅</span>

    <VueDatePicker
      class="flex-1 min-w-0"
      :model-value="pickerValue"
      :dark="uiStore.isDark"
      :year-picker="precision === 'year'"
      :month-picker="precision === 'month'"
      :time-picker="false"
      :formats="{ input: inputFormat }"
      :placeholder="computedPlaceholder"
      :min-date="minDate ? new Date(minDate) : undefined"
      :max-date="maxDate ? new Date(maxDate) : undefined"
      :year-range="[1900, new Date().getFullYear() + 5]"
      :auto-apply="true"
      :teleport="true"
      :locale="zhCN"
      :week-start="1"
      :ui="{ input: inputClass }"
      :input-attrs="{ id: inputId, hideInputIcon: true, clearable: true }"
      :action-row="{ showSelect: false, showCancel: false, showNow: true, nowBtnLabel: '今天' }"
      @update:model-value="onUpdate"
    />
  </div>
</template>
