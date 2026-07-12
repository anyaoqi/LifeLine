<script setup lang="ts">
import { computed } from 'vue'
import EventCard from './EventCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useUserStore } from '@/stores/userStore'
import { useEventStore } from '@/stores/eventStore'
import { formatChineseDate } from '@/utils/dateUtils'
import type { LifeEvent } from '@/types'

const userStore = useUserStore()
const eventStore = useEventStore()

const emit = defineEmits<{ edit: [event: LifeEvent]; delete: [event: LifeEvent]; add: [] }>()

// 带年份与全局索引的事件项
interface TimelineItem {
  event: LifeEvent
  year: number
  isNewYear: boolean   // 该项是否是某年的第一个（用于渲染年份标题）
  globalIndex: number  // 全局序号（驱动左右交替，避免按年份重置）
}

// 最新在上，按年份分组并打上全局索引；基于筛选后的事件
const flatItems = computed<TimelineItem[]>(() => {
  const sorted = [...eventStore.filteredSortedEvents].reverse() // 最新在上
  const items: TimelineItem[] = []
  let seenYears = new Set<number>()
  let idx = 0
  for (const event of sorted) {
    const year = new Date(event.date).getFullYear()
    items.push({
      event,
      year,
      isNewYear: !seenYears.has(year),
      globalIndex: idx,
    })
    seenYears.add(year)
    idx++
  }
  return items
})

const isEmpty = computed(() => eventStore.totalCount === 0)

// 有事件但筛选后无结果（区别于完全没数据）
const noFilterResult = computed(
  () => !isEmpty.value && eventStore.filteredCount === 0
)

const birthLabel = computed(() => formatChineseDate(userStore.user?.birthDate))
</script>

<template>
  <div v-if="isEmpty" class="text-center py-16 px-4 animate-fade-in">
    <div class="text-6xl mb-4">🌱</div>
    <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
      还没有记录任何事件
    </h3>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
      从第一个人生节点开始，构建你的时间线吧
    </p>
    <AppButton @click="emit('add')">
      ＋ 添加第一个事件
    </AppButton>
  </div>

  <!-- 有数据但筛选后无结果 -->
  <div v-else-if="noFilterResult" class="text-center py-16 px-4 animate-fade-in">
    <div class="text-6xl mb-4">🔍</div>
    <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
      没有匹配的事件
    </h3>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
      试试调整搜索关键词或筛选分类
    </p>
    <AppButton variant="secondary" @click="eventStore.clearFilters()">
      清除筛选
    </AppButton>
  </div>

  <div v-else class="timeline-container relative py-8 px-4 sm:px-6">
    <!-- 中心时间轴线 -->
    <div class="timeline-line"></div>

    <!-- 起点：出生日期 -->
    <div class="timeline-start">
      <div class="timeline-node timeline-node--start" title="出生">
        <span>👶</span>
      </div>
      <div class="timeline-start-label">
        <span class="text-xs text-gray-400">人生的起点</span>
        <div class="text-sm font-medium text-gray-600 dark:text-gray-300">
          🎂 {{ birthLabel }}
        </div>
      </div>
    </div>

    <!-- 扁平化事件列表（年份标题随事件内联渲染，保证全局交替连续） -->
    <div
      v-for="item in flatItems"
      :key="item.event.id"
      class="timeline-item"
      :class="{ 'timeline-item--left': item.globalIndex % 2 === 1 }"
      :style="{ '--item-index': item.globalIndex }"
    >
      <!-- 年份标题（仅在新年的第一项前显示） -->
      <div v-if="item.isNewYear" class="timeline-year-title">
        <span>{{ item.year }}</span>
      </div>

      <!-- 节点 -->
      <div class="timeline-node" :title="item.event.title"></div>

      <!-- 卡片 -->
      <div class="timeline-card-wrapper">
        <EventCard :event="item.event" @edit="emit('edit', $event)" @delete="emit('delete', $event)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 中心竖线 */
.timeline-line {
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #D4A574;
  opacity: 0.6;
}

/* 移动端：线条偏左；桌面端：居中 */
@media (min-width: 768px) {
  .timeline-line {
    left: 50%;
    transform: translateX(-50%);
  }
}

/* 出生起点 */
.timeline-start {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 20px; /* 与左线对齐 */
  transform: translateX(-50%);
  margin-bottom: 40px;
  padding: 12px 16px;
  background-color: rgba(212, 165, 116, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(212, 165, 116, 0.3);
}

.timeline-start-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}

/* 节点圆圈 */
.timeline-node {
  position: absolute;
  left: 20px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transform: translateX(-50%);
  z-index: 1;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.dark .timeline-node {
  box-shadow: 0 0 0 3px rgba(42, 42, 42, 0.9);
}

.timeline-node--start {
  position: static; /* 在 start 容器内 */
  width: 36px;
  height: 36px;
  background-color: #D4A574 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transform: none;
  box-shadow: 0 2px 8px rgba(212, 165, 116, 0.4);
}

/* 桌面端节点居中 */
@media (min-width: 768px) {
  .timeline-node {
    left: 50%;
  }
}

/* 单个事件项 */
.timeline-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: 24px;
}

/* 卡片包装：移动端在右侧，桌面端交替 */
.timeline-card-wrapper {
  width: 100%;
  padding-left: 40px; /* 给节点留空间 */
}

@media (min-width: 768px) {
  .timeline-item {
    /* 桌面端：用 grid 实现左右交替 */
    display: grid;
    grid-template-columns: 1fr 60px 1fr;
    align-items: start;
  }

  .timeline-node {
    grid-column: 2;
    position: relative;
    left: auto;
    transform: translateX(0);
    margin: 6px auto 0;
  }

  .timeline-card-wrapper {
    grid-column: 3;
    padding-left: 16px;
    padding-right: 0;
    width: auto;
    animation: slideInRight 0.4s ease-out both;
    animation-delay: calc(var(--item-index, 0) * 0.05s);
  }

  /* 全局奇数项（globalIndex 为奇数）：卡片在左，保证跨年份连续交替 */
  .timeline-item--left .timeline-card-wrapper {
    grid-column: 1;
    padding-left: 0;
    padding-right: 16px;
    text-align: right;
    animation-name: slideInLeft;
  }

  /* 年份标题横跨整行 */
  .timeline-year-title {
    grid-column: 1 / -1;
  }
}

/* 年份标题 */
.timeline-year-title {
  position: relative;
  display: flex;
  justify-content: center;
  margin: 40px 0 24px;
}

.timeline-year-title span {
  position: relative;
  z-index: 2;
  background-color: #D4A574;
  color: white;
  font-size: 14px;
  font-weight: 600;
  padding: 4px 14px;
  border-radius: 9999px;
  box-shadow: 0 2px 6px rgba(212, 165, 116, 0.3);
}

/* 第一项（含新年份标题）不需要顶部 margin */
.timeline-item:first-child .timeline-year-title {
  margin-top: 0;
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

/* 暗色模式下节点白边改为深色边 */
:global(.dark) .timeline-node {
  box-shadow: 0 0 0 3px rgba(26, 25, 24, 0.95);
}
</style>
