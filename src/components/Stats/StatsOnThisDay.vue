<script setup lang="ts">
import { computed } from 'vue'
import { getOnThisDay } from '@/utils/stats'
import { getCategory } from '@/utils/constants'
import type { LifeEvent } from '@/types'

/** 那年今日:与今天同月同日的历史记录(纪念册的回顾时刻) */
const props = defineProps<{ events: LifeEvent[]; birthDate?: string }>()

const items = computed(() => getOnThisDay(props.events))
const todayLabel = computed(() => {
  const now = new Date()
  return `${now.getMonth() + 1} 月 ${now.getDate()} 日`
})

function colorOf(category: string): string {
  return getCategory(category).color
}

function ageAt(year: number): number | null {
  if (!props.birthDate) return null
  return year - new Date(props.birthDate).getFullYear()
}
</script>

<template>
  <section v-if="items.length > 0" class="mb-8">
    <div class="mb-3 flex items-baseline justify-between">
      <h2 class="font-display text-lg font-bold text-app-ink">那年今日</h2>
      <span class="text-xs text-app-ink-faint">{{ todayLabel }}</span>
    </div>
    <div class="grid gap-3 sm:grid-cols-2">
      <div
        v-for="item in items"
        :key="item.event.id"
        class="relative overflow-hidden rounded-xl border p-4"
        :style="{
          borderColor: colorOf(item.event.category) + '40',
          background: `linear-gradient(135deg, ${colorOf(item.event.category)}0d, transparent)`,
        }"
      >
        <span
          class="font-display text-2xl font-bold"
          :style="{ color: colorOf(item.event.category) }"
        >{{ item.year }}</span>
        <p class="mt-1 font-medium text-app-ink">{{ item.event.title }}</p>
        <p class="mt-0.5 text-xs text-app-ink-faint">
          <template v-if="ageAt(item.year) !== null">{{ ageAt(item.year) }} 岁 · </template>{{ item.event.datePrecision === 'day' ? '同月同日' : '同月' }}
        </p>
      </div>
    </div>
  </section>
</template>
