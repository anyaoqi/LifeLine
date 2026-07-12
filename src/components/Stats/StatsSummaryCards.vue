<script setup lang="ts">
import { computed } from 'vue'
import type { OverviewStat } from '@/utils/stats'

interface Props {
  stats: OverviewStat
  userAge: number
}

const props = defineProps<Props>()

const cards = computed(() => [
  {
    label: '人生节点',
    value: String(props.stats.total),
    suffix: '个',
    icon: '✦',
    color: 'text-primary-500',
  },
  {
    label: '记录跨度',
    value: props.stats.spanYears > 0 ? String(props.stats.spanYears) : '—',
    suffix: props.stats.spanYears > 0 ? '年' : '',
    icon: '📅',
    color: 'text-primary-500',
  },
  {
    label: '最活跃年份',
    value: props.stats.topYear ? String(props.stats.topYear.year) : '—',
    suffix: props.stats.topYear ? `${props.stats.topYear.count} 件` : '',
    icon: '🔥',
    color: 'text-primary-500',
  },
  {
    label: '主要分类',
    value: props.stats.topCategory ? props.stats.topCategory.emoji : '—',
    suffix: props.stats.topCategory ? props.stats.topCategory.label : '',
    icon: '',
    color: 'text-primary-500',
  },
  {
    label: '时间点事件',
    value: String(props.stats.pointCount),
    suffix: '个',
    icon: '•',
    color: 'text-primary-500',
  },
  {
    label: '时间区间',
    value: String(props.stats.periodCount),
    suffix: '个',
    icon: '⟶',
    color: 'text-primary-500',
  },
])
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
    <div
      v-for="card in cards"
      :key="card.label"
      class="card-base p-4 sm:p-5"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-500 dark:text-gray-400">{{ card.label }}</span>
        <span v-if="card.icon" class="text-sm opacity-60">{{ card.icon }}</span>
      </div>
      <div class="mt-2 flex items-baseline gap-1">
        <span class="text-2xl sm:text-3xl font-bold" :class="card.color">{{ card.value }}</span>
        <span v-if="card.suffix" class="text-xs text-gray-400 dark:text-gray-500">{{ card.suffix }}</span>
      </div>
    </div>
  </div>
</template>
