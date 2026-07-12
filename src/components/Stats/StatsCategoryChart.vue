<script setup lang="ts">
import { computed } from 'vue'
import type { CategoryStat } from '@/utils/stats'

interface Props {
  data: CategoryStat[]
}

const props = defineProps<Props>()

const maxCount = computed(() =>
  props.data.length ? Math.max(...props.data.map((d) => d.count), 1) : 1
)

// 条形宽度百分比
function barWidthPercent(count: number): number {
  return Math.max((count / maxCount.value) * 100, 2)
}
</script>

<template>
  <div v-if="data.length === 0" class="text-center py-10 text-sm text-gray-400 dark:text-gray-500">
    暂无数据
  </div>

  <ul v-else class="space-y-3">
    <li
      v-for="item in data"
      :key="item.key"
      class="group"
    >
      <!-- 标签行 -->
      <div class="flex items-center justify-between mb-1.5 text-sm">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-base flex-shrink-0">{{ item.emoji }}</span>
          <span class="text-gray-700 dark:text-gray-200 truncate">{{ item.label }}</span>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="text-xs text-gray-400 dark:text-gray-500">{{ item.percentage }}%</span>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ item.count }}</span>
        </div>
      </div>

      <!-- 条形 -->
      <div class="h-2.5 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500 ease-out group-hover:opacity-80"
          :style="{
            width: `${barWidthPercent(item.count)}%`,
            backgroundColor: item.color,
          }"
        />
      </div>
    </li>
  </ul>
</template>
