<script setup lang="ts">
import { computed } from 'vue'
import type { YearStat } from '@/utils/stats'

interface Props {
  data: YearStat[]
}

const props = defineProps<Props>()

// 最大值用于计算柱高比例
const maxCount = computed(() =>
  props.data.length ? Math.max(...props.data.map((d) => d.count), 1) : 1
)

// 是否柱子太多需要横向滚动（超过 20 年）
const needScroll = computed(() => props.data.length > 20)

// 每根柱子的宽度（柱子多时收窄）
const barWidth = computed(() => {
  const n = props.data.length
  if (n <= 10) return 36
  if (n <= 20) return 24
  return 16
})

// 柱高百分比（最少给 2% 让 0 值也可见）
function barHeightPercent(count: number): number {
  if (count === 0) return 0
  return Math.max((count / maxCount.value) * 100, 3)
}
</script>

<template>
  <div v-if="data.length === 0" class="text-center py-10 text-sm text-gray-400 dark:text-gray-500">
    暂无数据
  </div>

  <div v-else class="overflow-x-auto">
    <div
      class="flex items-end gap-1 sm:gap-2 h-48 sm:h-56 px-1"
      :style="needScroll ? { minWidth: `${data.length * (barWidth + 8)}px` } : {}"
    >
      <div
        v-for="item in data"
        :key="item.year"
        class="flex-1 flex flex-col items-center justify-end group min-w-0"
        :style="{ minWidth: `${barWidth}px` }"
      >
        <!-- 数量标签（悬停显示，最大值年份常驻） -->
        <div
          class="text-xs font-medium mb-1 transition-opacity"
          :class="item.count === maxCount && maxCount > 0
            ? 'text-primary-500 opacity-100'
            : 'text-gray-400 opacity-0 group-hover:opacity-100'"
        >
          {{ item.count }}
        </div>

        <!-- 柱子 -->
        <div
          class="w-full rounded-t-md transition-all duration-300 ease-out group-hover:opacity-80"
          :style="{
            height: `${barHeightPercent(item.count)}%`,
            backgroundColor: item.count === maxCount && maxCount > 0 ? '#D4A574' : '#EDBF84',
          }"
          :title="`${item.year}年 · ${item.count} 件`"
        />

        <!-- 年份 -->
        <div class="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1.5 whitespace-nowrap">
          {{ String(item.year).slice(-2) }}
        </div>
      </div>
    </div>

    <!-- X 轴说明 -->
    <div class="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
      {{ data[0].year }} – {{ data[data.length - 1].year }} 年 · 共 {{ data.length }} 年
    </div>
  </div>
</template>
