<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EventCard from './EventCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useUserStore } from '@/stores/userStore'
import { useEventStore } from '@/stores/eventStore'
import { formatChineseDate } from '@/utils/dateUtils'
import { getCategory, MIN_BAND_HEIGHT, NODE_SIZE_BY_IMPORTANCE } from '@/utils/constants'
import type { LifeEvent } from '@/types'

const userStore = useUserStore()
const eventStore = useEventStore()
const emit = defineEmits<{ edit: [event: LifeEvent]; delete: [event: LifeEvent]; add: [] }>()

interface TimelineItem {
  event: LifeEvent
  year: number
  isNewYear: boolean
  globalIndex: number
}

interface PeriodBand {
  id: string
  top: number
  height: number
  lane: number
  color: string
  ongoing: boolean
}

// 最新在上，按年份分组并打上全局索引；基于筛选后的事件。
const flatItems = computed<TimelineItem[]>(() => {
  const sorted = [...eventStore.filteredSortedEvents].reverse()
  const items: TimelineItem[] = []
  const seenYears = new Set<number>()
  let idx = 0
  for (const event of sorted) {
    const year = new Date(event.date).getFullYear()
    items.push({ event, year, isNewYear: !seenYears.has(year), globalIndex: idx })
    seenYears.add(year)
    idx++
  }
  return items
})

const isEmpty = computed(() => eventStore.totalCount === 0)
const noFilterResult = computed(() => !isEmpty.value && eventStore.filteredCount === 0)
const birthLabel = computed(() => formatChineseDate(userStore.user?.birthDate))

// ============ 区间色带布局 ============
// 卡片高度不固定，色带位置必须以实际节点坐标计算；通过插值使跨年区间连续贯穿年份分组。
const timelineRoot = ref<HTMLElement | null>(null)
const itemElements = new Map<string, HTMLElement>()
const periodBands = ref<PeriodBand[]>([])
let layoutFrame: number | null = null
let resizeObserver: ResizeObserver | null = null

function setItemRef(eventId: string, element: unknown) {
  if (element instanceof HTMLElement) itemElements.set(eventId, element)
  else itemElements.delete(eventId)
}

function visualEndTime(event: LifeEvent): number {
  if (event.isOngoing) return Date.now()
  if (!event.endDate) return new Date(event.date).getTime()
  const end = new Date(event.endDate)
  // 年/月精度的结束时间按该时间段末尾计算，保证「2016年–2019年」贯穿完整 2019 年。
  if (event.endDatePrecision === 'year') return new Date(end.getFullYear(), 11, 31, 12).getTime()
  if (event.endDatePrecision === 'month') return new Date(end.getFullYear(), end.getMonth() + 1, 0, 12).getTime()
  return end.getTime()
}

function schedulePeriodLayout() {
  if (layoutFrame !== null) cancelAnimationFrame(layoutFrame)
  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = null
    void nextTick(buildPeriodBands)
  })
}

function buildPeriodBands() {
  const root = timelineRoot.value
  if (!root) {
    periodBands.value = []
    return
  }

  const rootTop = root.getBoundingClientRect().top
  const points = flatItems.value
    .map(({ event }) => {
      const item = itemElements.get(event.id)
      const node = item?.querySelector<HTMLElement>('[data-timeline-node]')
      if (!node) return null
      const rect = node.getBoundingClientRect()
      return { time: new Date(event.date).getTime(), y: rect.top - rootTop + rect.height / 2 }
    })
    .filter((point): point is { time: number; y: number } => point !== null)
    .sort((a, b) => a.time - b.time)

  if (points.length === 0) {
    periodBands.value = []
    return
  }

  function yAt(time: number): number {
    const first = points[0]
    const last = points[points.length - 1]
    // 给最新事件之后（尤其是「至今」）留出一小段连续色带，而不是截断在最近节点。
    if (time >= last.time) return Math.max(12, last.y - (time === last.time ? 0 : 28))
    if (time <= first.time) return first.y
    for (let index = 0; index < points.length - 1; index++) {
      const before = points[index]
      const after = points[index + 1]
      if (time >= before.time && time <= after.time) {
        const ratio = (time - before.time) / (after.time - before.time)
        return before.y + (after.y - before.y) * ratio
      }
    }
    return first.y
  }

  const periods = flatItems.value
    .map(item => item.event)
    .filter(event => event.type === 'period')
    .map(event => ({
      event,
      start: new Date(event.date).getTime(),
      end: visualEndTime(event),
    }))
    .sort((a, b) => a.start - b.start)

  // 贪心分配并行泳道：两个重叠阶段不会盖住对方。
  const laneEnds: number[] = []
  periodBands.value = periods.map(({ event, start, end }) => {
    let lane = laneEnds.findIndex(laneEnd => laneEnd < start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(end)
    } else {
      laneEnds[lane] = end
    }
    const startY = yAt(start)
    const endY = yAt(end)
    const rawHeight = Math.abs(startY - endY)
    const height = Math.max(MIN_BAND_HEIGHT, rawHeight)
    return {
      id: event.id,
      top: Math.min(startY, endY) - (height - rawHeight) / 2,
      height,
      lane,
      color: getCategory(event.category).color,
      ongoing: event.isOngoing === true,
    }
  })
}

function nodeStyle(event: LifeEvent) {
  const size = NODE_SIZE_BY_IMPORTANCE[event.importance ?? 3]
  return {
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: getCategory(event.category).color,
    '--node-color': getCategory(event.category).color,
    '--node-glow': `${getCategory(event.category).color}66`,
  }
}

onMounted(() => {
  schedulePeriodLayout()
  if (timelineRoot.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(schedulePeriodLayout)
    resizeObserver.observe(timelineRoot.value)
  }
  window.addEventListener('resize', schedulePeriodLayout)
})

watch(flatItems, schedulePeriodLayout, { flush: 'post' })

onBeforeUnmount(() => {
  if (layoutFrame !== null) cancelAnimationFrame(layoutFrame)
  resizeObserver?.disconnect()
  window.removeEventListener('resize', schedulePeriodLayout)
})
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

  <div v-else ref="timelineRoot" class="timeline-container relative py-8 px-4 sm:px-6">
    <!-- 区间色带图层：在中心轴后方连续渲染，不受年份标题切割 -->
    <div class="timeline-period-layer" aria-hidden="true">
      <div
        v-for="band in periodBands"
        :key="band.id"
        class="timeline-period-band"
        :class="{ 'timeline-period-band--ongoing': band.ongoing }"
        :style="{
          top: `${band.top}px`,
          height: `${band.height}px`,
          '--band-lane': band.lane,
          '--band-color': band.color,
        }"
      ></div>
    </div>

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
      :class="{
        'timeline-item--left': item.globalIndex % 2 === 1,
        'timeline-item--period': item.event.type === 'period',
      }"
      :style="{ '--item-index': item.globalIndex }"
      :ref="(element) => setItemRef(item.event.id, element)"
    >
      <!-- 年份标题（仅在新年的第一项前显示） -->
      <div v-if="item.isNewYear" class="timeline-year-title">
        <span>{{ item.year }}</span>
      </div>

      <!-- 节点：重要程度决定尺寸，分类决定颜色；区间节点用空心环以区别时间点 -->
      <div
        class="timeline-node"
        :class="{
          'timeline-node--period': item.event.type === 'period',
          'timeline-node--milestone': item.event.importance >= 5,
        }"
        :style="nodeStyle(item.event)"
        :title="`${item.event.title}（${item.event.type === 'period' ? '时间区间' : '时间点'}）`"
        data-timeline-node
      ></div>

      <!-- 卡片 -->
      <div class="timeline-card-wrapper">
        <EventCard :event="item.event" @edit="emit('edit', $event)" @delete="emit('delete', $event)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 区间色带位于主轴之后。实际坐标由节点测量并插值得到，因此可跨越年份标题连续延伸。 */
.timeline-period-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.timeline-period-band {
  --band-width: 6px;
  position: absolute;
  left: calc(20px + (var(--band-lane) * 10px));
  width: var(--band-width);
  min-height: 24px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: color-mix(in srgb, var(--band-color) 45%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--band-color) 25%, transparent);
}

/* 起止横杠让区间（▮）和时间点（●）不依赖文字也可区分。 */
.timeline-period-band::before,
.timeline-period-band::after {
  content: '';
  position: absolute;
  left: 50%;
  width: 12px;
  height: 2px;
  border-radius: 999px;
  transform: translateX(-50%);
  background: var(--band-color);
}
.timeline-period-band::before { top: 0; }
.timeline-period-band::after { bottom: 0; }
.timeline-period-band--ongoing::before {
  height: 20px;
  top: -8px;
  background: linear-gradient(to bottom, transparent, var(--band-color));
}

/* 中心竖线 */
.timeline-line {
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #D4A574;
  opacity: 0.6;
  z-index: 1;
}

/* 移动端：线条偏左；桌面端：居中 */
@media (min-width: 768px) {
  .timeline-line {
    left: 50%;
    transform: translateX(-50%);
  }

  .timeline-period-band {
    left: calc(50% + (var(--band-lane) * 10px));
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
  z-index: 3;
}

.timeline-start-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}

/* 节点圆圈：尺寸由重要程度内联控制，分类色由 nodeStyle 注入。 */
.timeline-node {
  position: absolute;
  left: 20px;
  min-width: 8px;
  min-height: 8px;
  box-sizing: border-box;
  border-radius: 50%;
  transform: translateX(-50%);
  z-index: 3;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* 区间用空心环，时间点是实心点。 */
.timeline-node--period {
  background-color: transparent !important;
  border: 3px solid var(--node-color);
}

.timeline-node--milestone {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.95), 0 0 14px var(--node-glow);
}

.dark .timeline-node {
  box-shadow: 0 0 0 3px rgba(42, 42, 42, 0.9);
}
.dark .timeline-node--milestone {
  box-shadow: 0 0 0 3px rgba(26, 25, 24, 0.95), 0 0 14px var(--node-glow);
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
  z-index: 2;
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

/* 暗色模式下节点白边改为深色边，里程碑仍保留发光。 */
:global(.dark) .timeline-node {
  box-shadow: 0 0 0 3px rgba(26, 25, 24, 0.95);
}
:global(.dark) .timeline-node--milestone {
  box-shadow: 0 0 0 3px rgba(26, 25, 24, 0.95), 0 0 14px var(--node-glow);
}
</style>
