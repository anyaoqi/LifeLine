<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { getCategory, getImportance } from '@/utils/constants'
import { calcDuration, formatAgeAtDate, formatChineseDate, formatDateRange, relativeTime } from '@/utils/dateUtils'
import { useUserStore } from '@/stores/userStore'
import type { LifeEvent } from '@/types'

interface Props {
  event: LifeEvent
}

const props = defineProps<Props>()
const emit = defineEmits<{ edit: [event: LifeEvent]; delete: [event: LifeEvent] }>()
const userStore = useUserStore()
const expanded = ref(false)

const isPeriod = computed(() => props.event.type === 'period')
const category = computed(() => getCategory(props.event.category))
const importance = computed(() => getImportance(props.event.importance))

// 区间事件始终显示起止/至今；点事件只显示按精度裁剪后的单日期。
const dateText = computed(() => isPeriod.value
  ? formatDateRange(
      props.event.date,
      props.event.endDate,
      props.event.datePrecision,
      props.event.endDatePrecision,
      props.event.isOngoing,
    )
  : formatChineseDate(props.event.date, props.event.datePrecision),
)

const durationText = computed(() => isPeriod.value
  ? calcDuration(props.event.date, props.event.endDate, props.event.isOngoing)
  : '',
)

const ageText = computed(() => formatAgeAtDate(
  userStore.user?.birthDate,
  props.event.date,
  props.event.datePrecision,
))

watch(
  () => props.event.description,
  () => { expanded.value = false },
)
</script>

<template>
  <article
    class="event-card group relative overflow-hidden rounded-xl border border-gray-200/80 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
    :class="{ 'event-card--milestone': event.importance >= 5 }"
    :style="{
      '--category-color': category.color,
      '--category-soft': category.color + '16',
    }"
  >
    <!-- 分类色强调线 -->
    <div class="h-1 w-full" :style="{ backgroundColor: category.color }"></div>

    <div class="px-4 pb-3.5 pt-3">
      <!-- 分类与重要度：弱化为眉题 -->
      <div class="mb-2 flex min-h-5 items-center gap-2">
        <span
          class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
          :style="{ backgroundColor: category.color + '18', color: category.color }"
        >
          <span aria-hidden="true">{{ category.emoji }}</span>
          {{ category.label }}
        </span>
        <span class="text-[11px] text-gray-400 dark:text-gray-500">
          {{ isPeriod ? '时间区间' : '时间点' }}
        </span>
        <span
          v-if="event.importance >= 4"
          class="ml-auto text-[11px] font-semibold text-primary-600 dark:text-primary-300"
        >{{ importance.label }}</span>
      </div>

      <!-- 标题：卡片第一视觉焦点 -->
      <h3 class="break-words text-lg font-bold leading-snug text-gray-900 dark:text-white">
        {{ event.title }}
      </h3>

      <!-- 时间：独立高亮信息块 -->
      <div
        class="mt-3 flex items-center gap-3 rounded-lg border px-3 py-2.5"
        :style="{
          backgroundColor: category.color + '0d',
          borderColor: category.color + '28',
        }"
      >
        <span
          class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-base"
          :style="{ backgroundColor: category.color + '1f' }"
          aria-hidden="true"
        >{{ isPeriod ? '▮' : '●' }}</span>
        <div class="min-w-0 flex-1">
          <time class="block break-words text-sm font-bold leading-snug text-gray-800 dark:text-gray-100">
            {{ dateText }}
          </time>
          <div class="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-gray-500 dark:text-gray-400">
            <span v-if="durationText">持续 {{ durationText }}</span>
            <span v-else>{{ relativeTime(event.date) }}</span>
            <span v-if="ageText">当时 {{ ageText }}</span>
          </div>
        </div>
      </div>

      <!-- 描述：仅有内容时出现，保持紧凑 -->
      <div v-if="event.description" class="mt-3">
        <p
          class="break-words text-[13px] leading-5 text-gray-600 dark:text-gray-300"
          :class="expanded ? '' : 'line-clamp-2'"
        >{{ event.description }}</p>
        <button
          v-if="event.description.length > 60"
          type="button"
          class="mt-1 text-[11px] font-medium text-primary-500 hover:text-primary-600"
          @click="expanded = !expanded"
        >{{ expanded ? '收起' : '展开全文' }}</button>
      </div>

      <!-- 操作：不再撑出一整块空白，移动端始终可见 -->
      <div class="mt-2.5 flex items-center justify-end gap-1 border-t border-gray-100 pt-2 dark:border-gray-700/70 md:opacity-0 md:group-hover:opacity-100">
        <button
          type="button"
          class="rounded-md px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
          @click="emit('edit', event)"
        >编辑</button>
        <button
          type="button"
          class="rounded-md px-2.5 py-1 text-[11px] font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          @click="emit('delete', event)"
        >删除</button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.event-card--milestone {
  border-color: color-mix(in srgb, var(--category-color) 40%, transparent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--category-color) 14%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .event-card {
    transition: none;
  }
  .event-card:hover {
    transform: none;
  }
}
</style>