<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { getCategory } from '@/utils/constants'
import { formatChineseDate, relativeTime, formatDateRange, calcDuration } from '@/utils/dateUtils'
import type { LifeEvent } from '@/types'

interface Props {
  event: LifeEvent
}

const props = defineProps<Props>()
const emit = defineEmits<{ edit: [event: LifeEvent]; delete: [event: LifeEvent] }>()

const expanded = ref(false)

// 计算显示用的日期文本：区间事件显示「起始 ~ 结束」，时间点显示单日期
const dateText = computed(() => {
  if (props.event.type === 'period' && props.event.endDate) {
    return formatDateRange(props.event.date, props.event.endDate)
  }
  return formatChineseDate(props.event.date)
})

// 区间事件的持续时长
const durationText = computed(() => {
  if (props.event.type === 'period' && props.event.endDate) {
    return calcDuration(props.event.date, props.event.endDate)
  }
  return ''
})

// 描述内容变化（编辑后）时重置展开状态，避免展开/收起按钮与新内容不一致
watch(
  () => props.event.description,
  () => {
    expanded.value = false
  }
)
</script>

<template>
  <div
    class="card-base group relative overflow-hidden"
    :style="{ borderLeft: `4px solid ${getCategory(event.category).color}` }"
  >
    <!-- 分类色条（顶部细条） -->
    <div
      class="absolute top-0 left-0 right-0 h-1"
      :style="{ backgroundColor: getCategory(event.category).color }"
    ></div>

    <div class="p-5">
      <!-- 标题行 -->
      <div class="flex items-start justify-between gap-3">
        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100 leading-snug">
          <span class="mr-1">{{ getCategory(event.category).emoji }}</span>
          {{ event.title }}
        </h3>
      </div>

      <!-- 元信息 -->
      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        <span>{{ event.type === 'period' ? '📅' : '📌' }} {{ dateText }}</span>
        <!-- 区间事件显示持续时长，时间点事件显示距今多久 -->
        <span v-if="durationText">· ⏱ {{ durationText }}</span>
        <span v-else>· {{ relativeTime(event.date) }}</span>
        <span
          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
          :style="{
            backgroundColor: getCategory(event.category).color + '22',
            color: getCategory(event.category).color,
          }"
        >
          {{ getCategory(event.category).label }}
        </span>
      </div>

      <!-- 描述（可展开） -->
      <div v-if="event.description" class="mt-3">
        <p
          class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed transition-all"
          :class="expanded ? '' : 'line-clamp-2'"
        >
          {{ event.description }}
        </p>
        <button
          v-if="event.description.length > 80"
          type="button"
          class="mt-1 text-xs text-primary-500 hover:text-primary-600 transition-colors"
          @click="expanded = !expanded"
        >
          {{ expanded ? '收起' : '展开全部' }}
        </button>
      </div>

      <!-- 操作按钮 -->
      <div
        class="mt-4 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity"
      >
        <button
          type="button"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          @click="emit('edit', event)"
        >
          ✏️ 编辑
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          @click="emit('delete', event)"
        >
          🗑️ 删除
        </button>
      </div>
    </div>
  </div>
</template>
