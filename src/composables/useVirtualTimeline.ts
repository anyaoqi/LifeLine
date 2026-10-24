import { computed, ref, type Ref } from 'vue'
import type { LifeEvent } from '@/types'
import { getCategory } from '@/utils/constants'

/**
 * 时间线虚拟滚动布局引擎。
 *
 * 思路:卡片高度不固定,因此维护「测量缓存 + 估算值」的高度模型,
 * 以纯函数从事件列表推导所有年份分组 / 卡片 / 区间色带的 y 坐标;
 * 组件层只渲染视口 ± overscan 的分组。500+ 事件时布局计算 O(n)
 * 但 DOM 恒定,滚动不掉帧(产品红线)。
 *
 * 卡片渲染后通过 collectMeasurements() 回填真实高度,布局自动修正。
 */

export type CardKind = 'milestone' | 'standard' | 'minor'

export interface VirtualItem {
  event: LifeEvent
  kind: CardKind
  /** 容器内绝对 y */
  top: number
  height: number
  /** 节点中心 y(用于色带插值) */
  nodeY: number
  /** 时间线内全局序号(决定桌面端左右交替) */
  index: number
}

export interface VirtualGroup {
  year: number
  /** 容器内绝对 y */
  top: number
  height: number
  titleTop: number
  items: VirtualItem[]
}

export interface PeriodBand {
  id: string
  top: number
  height: number
  lane: number
  color: string
  ongoing: boolean
}

// ============ 布局常量 ============
export const BIRTH_SECTION_H = 112
export const END_SECTION_H = 96
export const YEAR_TITLE_H = 76
export const ITEM_GAP = 28
/** 节点中心相对卡片顶部的偏移 */
export const NODE_OFFSET = 34

const ESTIMATES: Record<CardKind, number> = {
  milestone: 168,
  standard: 132,
  minor: 48,
}

const OVERSCAN_PX = 700

export function cardKindOf(event: LifeEvent): CardKind {
  const level = event.importance ?? 3
  if (level >= 5) return 'milestone'
  if (level <= 2) return 'minor'
  return 'standard'
}

/** 区间的视觉终点:至今 → 现在;年/月精度 → 该时段末尾 */
function visualEndTime(event: LifeEvent): number {
  if (event.isOngoing) return Date.now()
  if (!event.endDate) return new Date(event.date).getTime()
  const end = new Date(event.endDate)
  if (event.endDatePrecision === 'year')
    return new Date(end.getFullYear(), 11, 31, 12).getTime()
  if (event.endDatePrecision === 'month')
    return new Date(end.getFullYear(), end.getMonth() + 1, 0, 12).getTime()
  return end.getTime()
}

export function useVirtualTimeline(
  events: Ref<LifeEvent[]>,
  containerRef: Ref<HTMLElement | null>,
) {
  /** 高度缓存:key = id:updatedAt:kind */
  const heightCache = new Map<string, number>()
  const cacheVersion = ref(0)

  const scrollY = ref(0)
  const containerTop = ref(0)
  const viewportH = ref(800)
  const stickyTop = ref(72)

  const isEmpty = computed(() => events.value.length === 0)

  // ============ 年份分组(升序:出生 → 现在,纪念册阅读方向) ============
  const yearGroupsRaw = computed(() => {
    const groups: { year: number; events: LifeEvent[] }[] = []
    for (const event of events.value) {
      const year = new Date(event.date).getFullYear()
      const last = groups[groups.length - 1]
      if (!last || last.year !== year) groups.push({ year, events: [event] })
      else last.events.push(event)
    }
    return groups
  })

  // ============ 完整布局(纯函数) ============
  const layout = computed(() => {
    void cacheVersion.value // 依赖:高度缓存更新时重建
    const groups: VirtualGroup[] = []
    const flat: VirtualItem[] = []
    let y = BIRTH_SECTION_H
    let index = 0

    for (const raw of yearGroupsRaw.value) {
      const groupTop = y
      const titleTop = y
      y += YEAR_TITLE_H
      const items: VirtualItem[] = []
      for (const event of raw.events) {
        const kind = cardKindOf(event)
        const key = `${event.id}:${event.updatedAt}:${kind}`
        const height = heightCache.get(key) ?? ESTIMATES[kind]
        const item: VirtualItem = {
          event,
          kind,
          top: y,
          height,
          nodeY: y + NODE_OFFSET,
          index: index++,
        }
        items.push(item)
        flat.push(item)
        y += height + ITEM_GAP
      }
      groups.push({ year: raw.year, top: groupTop, height: y - groupTop, titleTop, items })
    }

    const totalHeight = y - ITEM_GAP + END_SECTION_H
    return { groups, flat, totalHeight }
  })

  const totalHeight = computed(() => layout.value.totalHeight)

  // ============ 视口窗口 ============
  const visibleGroups = computed(() => {
    if (isEmpty.value) return []
    const viewTop = scrollY.value - containerTop.value - OVERSCAN_PX
    const viewBottom = viewTop + viewportH.value + OVERSCAN_PX * 2
    return layout.value.groups.filter(
      g => g.top + g.height >= viewTop && g.top <= viewBottom,
    )
  })

  /** 当前滚动到的年份(吸顶判定线以下最近分组) */
  const activeYear = computed<number | null>(() => {
    const groups = layout.value.groups
    if (groups.length === 0) return null
    const line = scrollY.value - containerTop.value + stickyTop.value + 40
    let current = groups[0].year
    for (const g of groups) {
      if (g.top <= line) current = g.year
      else break
    }
    // 滚到底部时点亮最后一年
    const doc = document.documentElement
    if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) {
      current = groups[groups.length - 1].year
    }
    return current
  })

  // ============ 区间色带:基于模型坐标,无需 DOM 测量 ============
  const periodBands = computed<PeriodBand[]>(() => {
    const flat = layout.value.flat
    if (flat.length === 0) return []

    const points = flat
      .map(item => ({ time: new Date(item.event.date).getTime(), y: item.nodeY }))
      .sort((a, b) => a.time - b.time)

    const last = points[points.length - 1]

    function yAt(time: number): number {
      if (time >= last.time) return last.y + 30
      if (time <= points[0].time) return points[0].y
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i]
        const b = points[i + 1]
        if (time >= a.time && time <= b.time) {
          const ratio = (time - a.time) / (b.time - a.time)
          return a.y + (b.y - a.y) * ratio
        }
      }
      return points[0].y
    }

    const periods = flat
      .map(item => item.event)
      .filter(e => e.type === 'period')
      .map(event => ({
        event,
        start: new Date(event.date).getTime(),
        end: visualEndTime(event),
      }))
      .sort((a, b) => a.start - b.start)

    // 贪心泳道:重叠区间不互相遮挡
    const laneEnds: number[] = []
    return periods.map(({ event, start, end }) => {
      let lane = laneEnds.findIndex(e => e < start)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(end)
      } else {
        laneEnds[lane] = end
      }
      const startY = yAt(start)
      const endY = yAt(end)
      const raw = Math.abs(startY - endY)
      const height = Math.max(24, raw)
      return {
        id: event.id,
        top: Math.min(startY, endY) - (height - raw) / 2,
        height,
        lane,
        color: getCategory(event.category).color,
        ongoing: event.isOngoing === true,
      }
    })
  })

  // ============ 滚动同步 ============
  let scrollFrame: number | null = null
  function onScroll() {
    if (scrollFrame !== null) return
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = null
      scrollY.value = window.scrollY
    })
  }

  function measureContainer() {
    const el = containerRef.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    containerTop.value = rect.top + window.scrollY
    viewportH.value = window.innerHeight
    const header = document.querySelector('header')
    stickyTop.value = (header?.offsetHeight ?? 64) + 8
  }

  // ============ 渲染后回填卡片高度 ============
  // rAF 对齐绘制帧;setTimeout 兜底 —— 后台标签页 rAF 冻结时测量仍会执行,
  // 否则布局永远停留在估算值,卡片间距虚大。
  let measureScheduled = false
  function scheduleMeasure() {
    if (measureScheduled) return
    measureScheduled = true
    const run = () => {
      measureScheduled = false
      collectMeasurements()
    }
    requestAnimationFrame(run)
    setTimeout(run, 90)
  }

  function collectMeasurements() {
    const el = containerRef.value
    if (!el) return
    let changed = false
    for (const node of el.querySelectorAll<HTMLElement>('[data-measure-key]')) {
      const key = node.dataset.measureKey!
      const height = node.offsetHeight
      if (height > 0 && heightCache.get(key) !== height) {
        heightCache.set(key, height)
        changed = true
      }
    }
    if (changed) cacheVersion.value++
  }

  // ============ 导航 ============
  function scrollToYear(year: number, extraOffset = 0) {
    const group = layout.value.groups.find(g => g.year === year)
    if (!group) return
    window.scrollTo({
      top: containerTop.value + group.titleTop - stickyTop.value - extraOffset + 4,
      behavior: 'smooth',
    })
  }

  function scrollToItem(index: number) {
    const item = layout.value.flat[index]
    if (!item) return
    const target = containerTop.value + item.top - stickyTop.value - viewportH.value * 0.3
    window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }

  return {
    // state
    scrollY,
    containerTop,
    stickyTop,
    // layout
    layout,
    totalHeight,
    visibleGroups,
    activeYear,
    periodBands,
    isEmpty,
    // methods
    onScroll,
    measureContainer,
    scheduleMeasure,
    scrollToYear,
    scrollToItem,
  }
}
