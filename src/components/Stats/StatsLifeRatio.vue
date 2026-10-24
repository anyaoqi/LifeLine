<script setup lang="ts">
import { computed } from 'vue'
import { getLifeRatio } from '@/utils/stats'
import type { LifeEvent } from '@/types'

/**
 * 人生比例:各分类的区间事件累计覆盖了多少年,占已活岁数的比例。
 * 一根堆叠条 + 图例,回答「我的岁月都花在了哪里」。
 */
const props = defineProps<{ events: LifeEvent[]; birthDate?: string }>()

const ratio = computed(() => getLifeRatio(props.events, props.birthDate))
const items = computed(() => ratio.value.items)
const totalYears = computed(() => ratio.value.totalYears)
const hasData = computed(() => items.value.length > 0 && totalYears.value > 0)
</script>

<template>
  <section v-if="hasData" class="mb-8">
    <div class="mb-3 flex items-baseline justify-between">
      <h2 class="font-display text-lg font-bold text-app-ink">人生比例</h2>
      <span class="text-xs text-app-ink-faint">已记录 {{ totalYears }} 岁中…</span>
    </div>

    <!-- 堆叠条 -->
    <div class="flex h-3.5 w-full overflow-hidden rounded-full bg-app-bg-deep">
      <div
        v-for="item in items"
        :key="item.key"
        :style="{
          width: `${Math.min(100, item.percentage)}%`,
          backgroundColor: item.color,
          opacity: 0.85,
        }"
        :title="`${item.label} ${item.years} 年(${item.percentage}%)`"
      />
    </div>

    <!-- 图例 -->
    <div class="mt-3.5 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
      <div v-for="item in items" :key="item.key" class="flex items-center gap-2 text-sm">
        <span class="h-2.5 w-2.5 flex-shrink-0 rounded-full" :style="{ backgroundColor: item.color }" />
        <span class="text-app-ink">{{ item.label }}</span>
        <span class="ml-auto text-xs text-app-ink-faint">{{ item.years }} 年 · {{ item.percentage }}%</span>
      </div>
    </div>
  </section>
</template>
