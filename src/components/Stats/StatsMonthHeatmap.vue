<script setup lang="ts">
import { computed } from 'vue'
import type { MonthStat } from '@/utils/stats'
import { getHeatLevel } from '@/utils/stats'

interface Props {
  data: MonthStat[]
}

const props = defineProps<Props>()

const maxCount = computed(() =>
  props.data.length ? Math.max(...props.data.map((d) => d.count), 1) : 1
)

// 热力色阶 → 实际背景色（品牌色由浅到深）
const HEAT_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: '#F5F1ED', // 无数据 - 暖白
  1: '#FDE9DC',
  2: '#F8D4B0',
  3: '#EDBF84',
  4: '#D4A574', // 最活跃 - 品牌色
}

const HEAT_COLORS_DARK: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: '#2D2B2A',
  1: '#4A3D2E',
  2: '#6B5A3F',
  3: '#9B703D',
  4: '#E6C9AB',
}

function heatStyle(count: number): Record<string, string> {
  const level = getHeatLevel(count, maxCount.value)
  // 同时设置浅/深两套背景色，深色模式由 CSS 变量切换
  return {
    '--heat-bg-light': HEAT_COLORS[level],
    '--heat-bg-dark': HEAT_COLORS_DARK[level],
  }
}
</script>

<template>
  <div v-if="data.length === 0" class="text-center py-10 text-sm text-gray-400 dark:text-gray-500">
    暂无数据
  </div>

  <div v-else>
    <!-- 12 个月网格 -->
    <div class="grid grid-cols-6 sm:grid-cols-12 gap-2">
      <div
        v-for="item in data"
        :key="item.month"
        class="flex flex-col items-center"
      >
        <div
          class="w-full aspect-square rounded-md flex items-center justify-center text-sm font-medium transition-all duration-300 hover:scale-105 cursor-default heat-cell"
          :style="heatStyle(item.count)"
          :title="`${item.label} · ${item.count} 件`"
        >
          <span
            v-if="item.count > 0"
            class="text-gray-700 dark:text-gray-100"
          >{{ item.count }}</span>
        </div>
        <div class="mt-1.5 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
          {{ item.label }}
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <div class="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
      <span>少</span>
      <div class="flex gap-1">
        <div
          v-for="(level, i) in ([0, 1, 2, 3, 4] as const)"
          :key="i"
          class="w-4 h-4 rounded-sm heat-cell"
          :style="{
            '--heat-bg-light': HEAT_COLORS[level],
            '--heat-bg-dark': HEAT_COLORS_DARK[level],
          }"
        />
      </div>
      <span>多</span>
    </div>
  </div>
</template>

<style scoped>
/* 通过 CSS 变量切换浅/深色背景，避免在模板里写 dark: 内联色 */
.heat-cell {
  background-color: var(--heat-bg-light);
}
:global(.dark) .heat-cell {
  background-color: var(--heat-bg-dark);
}
</style>
