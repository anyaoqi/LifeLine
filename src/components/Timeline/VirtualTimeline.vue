<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Plus, Sparkles } from 'lucide-vue-next'
import EventCard from './EventCard.vue'
import {
  useVirtualTimeline,
  BIRTH_SECTION_H,
  NODE_OFFSET,
  YEAR_TITLE_H,
  END_SECTION_H,
} from '@/composables/useVirtualTimeline'
import { useEventStore } from '@/stores/eventStore'
import { useUserStore } from '@/stores/userStore'
import { getCategory, NODE_SIZE_BY_IMPORTANCE } from '@/utils/constants'
import { formatChineseDate } from '@/utils/dateUtils'
import type { Importance, LifeEvent } from '@/types'

/**
 * 虚拟滚动时间线:
 *  - 布局引擎 useVirtualTimeline 以纯函数计算坐标,只渲染视口附近分组
 *  - 区间色带基于模型坐标绘制,不依赖 DOM 测量,虚拟化下依然正确
 *  - 键盘:↑↓ 在事件间移动,Enter 编辑,Esc 收起焦点
 */
const emit = defineEmits<{
  add: []
  templates: []
  edit: [event: LifeEvent]
  delete: [event: LifeEvent]
  confirm: [event: LifeEvent]
  open: [event: LifeEvent]
}>()

const eventStore = useEventStore()
const userStore = useUserStore()

const containerRef = ref<HTMLElement | null>(null)

// 展示列表:密度切换(只看大事 = importance ≥ 4)在 store 筛选之外叠加
const displayEvents = computed(() =>
  eventStore.onlyBigEvents
    ? eventStore.filteredSortedEvents.filter(e => (e.importance ?? 3) >= 4)
    : eventStore.filteredSortedEvents,
)

const {
  layout,
  totalHeight,
  visibleGroups,
  activeYear,
  periodBands,
  onScroll,
  measureContainer,
  scheduleMeasure,
  scrollToYear,
  scrollToItem,
  stickyTop,
} = useVirtualTimeline(displayEvents, containerRef)

/** 年份导航条吸附在页头下,年份标题再往下错开 */
const RAIL_H = 44
const titleStickyTop = computed(() => stickyTop.value + RAIL_H)
const allYears = computed(() =>
  layout.value.groups.map(g => ({ year: g.year, count: g.items.length })),
)

const flatItems = computed(() => layout.value.flat)

const birthLabel = computed(() => formatChineseDate(userStore.user?.birthDate))
const nowLabel = computed(() => `${userStore.userAge ?? ''} 岁 · 现在`)

const emptyState = computed(() => eventStore.totalCount === 0)
const noFilterResult = computed(
  () => !emptyState.value && displayEvents.value.length === 0,
)

function nodeSize(event: LifeEvent): string {
  const size = NODE_SIZE_BY_IMPORTANCE[(event.importance ?? 3) as Importance]
  return `${size}px`
}

function nodeColor(event: LifeEvent): string {
  return getCategory(event.category).color
}

// ============ 入场动画:同一卡片只播放一次(滚动重挂载不再重放) ============
const animatedIds = new Set<string>()
function enterClassFor(id: string): string {
  if (animatedIds.has(id)) return ''
  animatedIds.add(id)
  return 'tl-enter'
}

// ============ 生命周期 ============
let resizeObserver: ResizeObserver | null = null
let measureFrame: number | null = null
let measureTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  measureContainer()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
  if (containerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => scheduleMeasure())
    resizeObserver.observe(containerRef.value)
  }
  measureFrame = requestAnimationFrame(() => {
    measureContainer()
    scheduleMeasure()
  })
})

function onResize() {
  measureContainer()
}

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
  resizeObserver?.disconnect()
  if (measureFrame !== null) cancelAnimationFrame(measureFrame)
  if (measureTimer !== null) clearTimeout(measureTimer)
})

// 数据/筛选变化后:重测容器位置并回填高度
watch(
  () => [displayEvents.value.length, eventStore.onlyBigEvents],
  () => {
    measureContainer()
    scheduleMeasure()
  },
)
// 视口内渲染集合变化(新分组或同组边缘卡进出场)后补测高度。
// 注意按事件 id 观测:在同一年份组内滚动时年份串不变,但渲染集合会变。
watch(
  () => visibleGroups.value.map(g => g.items.map(i => i.event.id).join(',')).join('|'),
  () => scheduleMeasure(),
)

// ============ 键盘导航(roving focus) ============
function onKeydown(e: KeyboardEvent) {
  if (!['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) return
  const cards = Array.from(
    containerRef.value?.querySelectorAll<HTMLElement>('[data-event-id]') ?? [],
  )
  if (cards.length === 0) return

  if (e.key === 'Escape') {
    ;(document.activeElement as HTMLElement | null)?.blur()
    return
  }

  const currentIdx = cards.findIndex(c => c === document.activeElement)

  if (e.key === 'Enter') {
    if (currentIdx < 0) return
    e.preventDefault()
    const id = cards[currentIdx].dataset.eventId!
    const item = flatItems.value.find(i => i.event.id === id)
    if (item) emit('edit', item.event)
    return
  }

  // ↑↓:基于模型序号移动,目标未渲染时先滚动再聚焦
  e.preventDefault()
  const delta = e.key === 'ArrowDown' ? 1 : -1
  let nextFlat: number
  if (currentIdx === -1) {
    nextFlat = delta === 1 ? 0 : flatItems.value.length - 1
  } else {
    const currentId = cards[currentIdx].dataset.eventId!
    const currentFlat = flatItems.value.findIndex(i => i.event.id === currentId)
    if (currentFlat === -1) return
    nextFlat = Math.min(Math.max(0, currentFlat + delta), flatItems.value.length - 1)
    if (nextFlat === currentFlat) return
  }
  const target = flatItems.value[nextFlat]
  if (!target) return

  const element = cards.find(c => c.dataset.eventId === target.event.id)
  if (element) {
    element.focus({ preventScroll: true })
    element.scrollIntoView({ block: 'center', behavior: 'smooth' })
  } else {
    scrollToItem(nextFlat)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = containerRef.value?.querySelector<HTMLElement>(
          `[data-event-id="${target.event.id}"]`,
        )
        el?.focus({ preventScroll: true })
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
    })
  }
}
</script>

<template>
  <!-- 空状态 -->
  <div v-if="emptyState" class="animate-fade-in px-4 py-16 text-center">
    <div
      class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-app-bg-deep"
    >
      <Plus :size="28" class="text-app-ink-faint" />
    </div>
    <h3 class="font-display text-xl font-semibold text-app-ink">
      人生纪念册还是空的
    </h3>
    <p class="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-app-ink-soft">
      从人生模板一键铺底(学业、职业、感情…),或者记下第一件小事
    </p>
    <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        class="inline-flex h-10 items-center gap-1.5 rounded-lg bg-app-accent px-4 text-sm font-medium text-white shadow-sm transition-all hover:brightness-95 active:scale-95"
        @click="emit('templates')"
      >
        <Sparkles :size="15" /> 从人生模板开始
      </button>
      <button
        type="button"
        class="inline-flex h-10 items-center gap-1.5 rounded-lg border border-app-border-strong px-4 text-sm font-medium text-app-ink transition-colors hover:bg-app-bg-deep"
        @click="emit('add')"
      >
        <Plus :size="15" /> 记录第一件事
      </button>
    </div>
  </div>

  <div v-else-if="noFilterResult" class="animate-fade-in px-4 py-16 text-center">
    <h3 class="font-display text-xl font-semibold text-app-ink">没有匹配的记录</h3>
    <p class="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-app-ink-soft">
      试试调整关键词或筛选条件
    </p>
    <button
      type="button"
      class="mt-6 inline-flex h-10 items-center rounded-lg border border-app-border-strong px-4 text-sm font-medium text-app-ink transition-colors hover:bg-app-bg-deep"
      @click="eventStore.clearFilters()"
    >
      清除筛选
    </button>
  </div>

  <!-- 虚拟滚动容器 -->
  <div
    v-else
    ref="containerRef"
    class="tl-root relative px-4 sm:px-6"
    :style="{ '--sticky-top': `${stickyTop}px`, '--title-sticky-top': `${titleStickyTop}px` }"
    tabindex="-1"
    @keydown="onKeydown"
  >
    <!-- 年份导航尺:粘性横条,点击直达该年,滚动时联动高亮 -->
    <nav
      class="tl-year-rail"
      :style="{ top: `${stickyTop}px` }"
      aria-label="年份快速跳转"
    >
      <button
        v-for="entry in allYears"
        :key="entry.year"
        type="button"
        class="tl-year-chip"
        :class="{ 'tl-year-chip--active': entry.year === activeYear }"
        :title="`${entry.year} 年 · ${entry.count} 条`"
        :aria-current="entry.year === activeYear ? 'true' : undefined"
        @click="scrollToYear(entry.year, RAIL_H)"
      >
        {{ entry.year }}<span>{{ entry.count }}</span>
      </button>
    </nav>

    <!-- 主体占位:撑起滚动高度,子项绝对定位 -->
    <div class="relative w-full" :style="{ height: `${totalHeight}px` }">
      <!-- 区间色带图层(基于模型坐标,无需测量) -->
      <div class="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div
          v-for="band in periodBands"
          :key="band.id"
          class="tl-band"
          :class="{ 'tl-band--ongoing': band.ongoing }"
          :style="{
            top: `${band.top}px`,
            height: `${band.height}px`,
            '--band-lane': band.lane,
            '--band-color': band.color,
          }"
        />
      </div>

      <!-- 中心轴 -->
      <div class="tl-axis" aria-hidden="true" />

      <!-- 出生起点 -->
      <div class="absolute inset-x-0 top-0" :style="{ height: `${BIRTH_SECTION_H}px` }">
        <div class="tl-node tl-node--birth" style="top: 50%">
          <span class="font-display">生</span>
        </div>
        <div class="absolute top-1/2 -translate-y-1/2" style="left: 54px">
          <p class="font-display text-base font-semibold text-app-ink">{{ birthLabel }}</p>
          <p class="mt-0.5 text-xs text-app-ink-soft">人生的起点</p>
        </div>
      </div>

      <!-- 年份分组(仅渲染视口附近) -->
      <div
        v-for="group in visibleGroups"
        :key="group.year"
        class="absolute inset-x-0"
        :style="{ top: `${group.top}px`, height: `${group.height}px` }"
      >
        <!-- 年份幽灵水印:纸面上的大字衬线数字 -->
        <div class="tl-year-ghost font-display" aria-hidden="true">{{ group.year }}</div>

        <!-- 吸顶年份标题 -->
        <div
          class="tl-year-title"
          :class="{ 'tl-year-title--active': group.year === activeYear }"
          :style="{ top: `${YEAR_TITLE_H - 58}px` }"
        >
          <i class="tl-year-line" aria-hidden="true" />
          <span class="font-display">{{ group.year }}</span>
          <i class="tl-year-line" aria-hidden="true" />
          <span class="tl-year-count">{{ group.items.length }} 条</span>
        </div>

        <!-- 事件卡片 -->
        <div
          v-for="item in group.items"
          :key="item.event.id"
          class="tl-item"
          :class="{
            'tl-item--left': item.index % 2 === 1,
            'tl-item--minor': item.kind === 'minor',
          }"
          :style="{ top: `${item.top - group.top}px`, height: `${item.height + 28}px` }"
        >
          <div
            class="tl-node"
            :class="{
              'tl-node--period': item.event.type === 'period',
              'tl-node--milestone': item.event.importance >= 5,
            }"
            :style="{
              top: `${item.top - group.top + NODE_OFFSET}px`,
              width: nodeSize(item.event),
              height: nodeSize(item.event),
              backgroundColor:
                item.event.type === 'period' ? 'transparent' : nodeColor(item.event),
              borderColor: nodeColor(item.event),
              '--node-color': nodeColor(item.event),
              '--node-glow': `${nodeColor(item.event)}66`,
            }"
            :title="`${item.event.title}(${item.event.type === 'period' ? '时间区间' : '时间点'})`"
          />
          <div class="tl-card-wrap" :style="{ top: `${item.top - group.top}px` }">
            <div
              :data-event-id="item.event.id"
              :class="[enterClassFor(item.event.id), 'outline-none']"
              :style="{ '--enter-delay': `${Math.min(item.index * 40, 260)}ms` }"
            >
              <EventCard
                :event="item.event"
                :measure-key="`${item.event.id}:${item.event.updatedAt}:${item.kind}`"
                @edit="emit('edit', $event)"
                @delete="emit('delete', $event)"
                @confirm="emit('confirm', $event)"
                @open="emit('open', $event)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 当下(终点) -->
      <div
        class="absolute inset-x-0"
        :style="{ top: `${totalHeight - END_SECTION_H}px`, height: `${END_SECTION_H}px` }"
      >
        <div class="tl-node tl-node--now" style="top: 38%">
          <span class="tl-ripple" aria-hidden="true" />
          <span class="tl-ripple tl-ripple--delay" aria-hidden="true" />
          <span class="tl-now-dot" aria-hidden="true" />
        </div>
        <div class="absolute top-[30%]" style="left: 54px">
          <p class="font-display text-sm font-semibold text-app-ink">现在</p>
          <p class="text-xs text-app-ink-faint">{{ nowLabel }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tl-root {
  --axis-x: 28px;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

/* ============ 中心轴:墨迹,挂载时自上而下画出 ============ */
.tl-axis {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--axis-x);
  width: 2px;
  border-radius: 999px;
  background: linear-gradient(
    to bottom,
    transparent,
    color-mix(in srgb, var(--app-accent) 60%, transparent) 72px,
    color-mix(in srgb, var(--app-accent) 60%, transparent) calc(100% - 80px),
    transparent
  );
  z-index: 1;
  transform-origin: top;
  animation: tl-axis-draw 0.9s var(--ease-out) both;
}
@keyframes tl-axis-draw {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}

@media (min-width: 768px) {
  .tl-root {
    --axis-x: 50%;
  }
}

/* ============ 节点 ============ */
.tl-node {
  position: absolute;
  left: var(--axis-x);
  transform: translate(-50%, -50%);
  min-width: 8px;
  min-height: 8px;
  box-sizing: border-box;
  border-radius: 50%;
  z-index: 3;
  box-shadow: 0 0 0 3px var(--app-bg);
  transition: transform 0.25s var(--ease-out);
}
.tl-item:hover .tl-node {
  transform: translate(-50%, -50%) scale(1.35);
}

.tl-node--period {
  border: 3px solid var(--node-color);
  background-color: var(--app-bg) !important;
}

/* 里程碑:外圈虚线环缓慢旋转(仅 transform,单实例量级) */
.tl-node--milestone::after {
  content: '';
  position: absolute;
  inset: -7px;
  border-radius: 50%;
  border: 1.5px dashed color-mix(in srgb, var(--node-color) 65%, transparent);
  animation: tl-spin 26s linear infinite;
}
@keyframes tl-spin {
  to { transform: rotate(360deg); }
}

.tl-node--birth {
  width: 34px;
  height: 34px;
  background: var(--app-accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--app-accent) 18%, transparent);
}

/* 「现在」:呼吸涟漪双环 */
.tl-node--now {
  width: 18px;
  height: 18px;
  background: var(--app-surface);
  border: 2px solid var(--app-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}
.tl-now-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--app-accent);
}
.tl-ripple {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  border: 1.5px solid var(--app-accent);
  animation: tl-ripple 2.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}
.tl-ripple--delay {
  animation-delay: 1.4s;
}
@keyframes tl-ripple {
  0% { transform: scale(1); opacity: 0.55; }
  70% { transform: scale(2.6); opacity: 0; }
  100% { transform: scale(2.6); opacity: 0; }
}

/* ============ 年份导航尺:粘性横条 ============ */
.tl-year-rail {
  position: sticky;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  margin: 0 -4px;
  padding: 4px 2px;
  overflow-x: auto;
  scrollbar-width: none;
  background: linear-gradient(to bottom, var(--app-bg) 78%, transparent);
}
.tl-year-rail::-webkit-scrollbar {
  display: none;
}

.tl-year-chip {
  flex-shrink: 0;
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  padding: 3px 11px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--app-ink-soft);
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, transform 0.15s var(--ease-out);
}
.tl-year-chip span {
  font-size: 10px;
  font-weight: 500;
  opacity: 0.6;
}
.tl-year-chip:hover {
  color: var(--app-accent);
  border-color: var(--app-accent);
  transform: translateY(-1px);
}
.tl-year-chip--active {
  color: #fff;
  background: var(--app-accent);
  border-color: var(--app-accent);
  box-shadow: 0 2px 6px rgb(184 131 77 / 0.35);
}

/* ============ 年份幽灵水印 ============ */
.tl-year-ghost {
  position: absolute;
  top: -6px;
  right: 4%;
  z-index: 0;
  font-size: clamp(72px, 9vw, 128px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.02em;
  color: color-mix(in srgb, var(--app-accent) 9%, transparent);
  pointer-events: none;
  user-select: none;
  transition: color 0.4s ease;
}
.tl-year-title--active ~ * .tl-year-ghost { color: color-mix(in srgb, var(--app-accent) 14%, transparent); }
@media (max-width: 767px) {
  .tl-year-ghost {
    right: auto;
    left: 44px;
  }
}

/* ============ 年份标题:吸顶,细线 + 衬线年份 ============ */
.tl-year-title {
  position: sticky;
  top: var(--title-sticky-top, 116px);
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.5rem 0 0.875rem;
  background: linear-gradient(to bottom, var(--app-bg) 62%, transparent);
}
.tl-year-line {
  width: clamp(16px, 6vw, 72px);
  height: 1px;
  background: linear-gradient(to right, transparent, var(--app-border-strong));
}
.tl-year-line:last-of-type {
  background: linear-gradient(to left, transparent, var(--app-border-strong));
}
.tl-year-title > span:first-of-type {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--app-ink);
  opacity: 0.85;
  transition: color 0.3s ease, opacity 0.3s ease, text-shadow 0.3s ease;
}
.tl-year-title--active > span:first-of-type {
  color: var(--app-accent);
  opacity: 1;
}
.tl-year-count {
  font-size: 11px;
  color: var(--app-ink-faint);
}

/* ============ 卡片落定:翻册的核心时刻 ============ */
.tl-enter {
  animation: tl-settle 0.4s var(--ease-out) both;
  animation-delay: var(--enter-delay, 0ms);
}
@keyframes tl-settle {
  from {
    opacity: 0.25;
    transform: translateY(10px) rotate(0.3deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) rotate(0deg);
  }
}

/* ============ 事件项容器 ============ */
.tl-item {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 2;
}

/* 卡片定位:移动端单列(轴右侧),桌面端左右交替 */
.tl-card-wrap {
  position: absolute;
  left: 52px;
  right: 0;
}
.tl-item--minor .tl-card-wrap {
  left: 46px;
}

@media (min-width: 768px) {
  .tl-card-wrap {
    left: calc(50% + 44px);
    right: 0;
  }
  .tl-item--left .tl-card-wrap {
    left: 0;
    right: calc(50% + 44px);
  }
  .tl-item--minor .tl-card-wrap {
    left: calc(50% + 40px);
    right: 14%;
  }
  .tl-item--left.tl-item--minor .tl-card-wrap {
    left: 14%;
    right: calc(50% + 40px);
  }
}

/* ============ 区间色带 ============ */
.tl-band {
  --band-width: 6px;
  position: absolute;
  left: calc(var(--axis-x) + (var(--band-lane) * 10px));
  width: var(--band-width);
  transform: translateX(-50%);
  border-radius: 999px;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--band-color) 32%, transparent),
    color-mix(in srgb, var(--band-color) 58%, transparent)
  );
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--band-color) 22%, transparent);
  z-index: 0;
}
.tl-band::before,
.tl-band::after {
  content: '';
  position: absolute;
  left: 50%;
  width: 12px;
  height: 2px;
  border-radius: 999px;
  transform: translateX(-50%);
  background: var(--band-color);
}
.tl-band::before {
  top: 0;
}
.tl-band::after {
  bottom: 0;
}
.tl-band--ongoing::before {
  height: 20px;
  top: -8px;
  background: linear-gradient(to bottom, transparent, var(--band-color));
}
</style>
