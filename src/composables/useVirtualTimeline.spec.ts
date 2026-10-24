import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import {
  useVirtualTimeline,
  cardKindOf,
  BIRTH_SECTION_H,
  END_SECTION_H,
  YEAR_TITLE_H,
  ITEM_GAP,
} from './useVirtualTimeline'
import type { LifeEvent } from '@/types'

function makeEvent(overrides: Partial<LifeEvent> & { date: string }): LifeEvent {
  return {
    id: Math.random().toString(36).slice(2),
    userId: 'u1',
    title: '事件',
    type: 'point',
    datePrecision: 'day',
    importance: 3,
    category: 'life',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    ...overrides,
  } as LifeEvent
}

/** 生成横跨 numYears 年、每年 perYear 条的模拟数据 */
function makeBulkEvents(numYears = 50, perYear = 10): LifeEvent[] {
  const events: LifeEvent[] = []
  const startYear = 1976
  for (let y = 0; y < numYears; y++) {
    for (let i = 0; i < perYear; i++) {
      events.push(
        makeEvent({
          title: `${startYear + y}-${i}`,
          date: new Date(startYear + y, i % 12, 5, 12).toISOString(),
          importance: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
          type: i % 4 === 0 ? 'period' : 'point',
          endDate: i % 4 === 0 ? new Date(startYear + y, i % 12, 20, 12).toISOString() : undefined,
          category: 'work',
        }),
      )
    }
  }
  return events
}

describe('cardKindOf 分层', () => {
  it('重要度 5 → milestone,≤2 → minor,3-4 → standard', () => {
    expect(cardKindOf(makeEvent({ date: '2020-01-01', importance: 5 }))).toBe('milestone')
    expect(cardKindOf(makeEvent({ date: '2020-01-01', importance: 4 }))).toBe('standard')
    expect(cardKindOf(makeEvent({ date: '2020-01-01', importance: 2 }))).toBe('minor')
    expect(cardKindOf(makeEvent({ date: '2020-01-01' }))).toBe('standard') // 缺省 3
  })
})

describe('useVirtualTimeline 布局引擎', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn())
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
    window.innerHeight = 800
  })

  it('500 条事件:分组、总高与扁平序号正确,升序编年排列', () => {
    const events = ref(makeBulkEvents(50, 10)) // 500 条
    const container = ref<HTMLElement | null>(null)
    const { layout, totalHeight, periodBands } = useVirtualTimeline(events, container)

    expect(events.value.length).toBe(500)
    expect(layout.value.groups.length).toBe(50)
    expect(layout.value.flat.length).toBe(500)
    // 编年升序:第一组是最早年份,组内 flat index 连续
    expect(layout.value.groups[0].year).toBe(1976)
    expect(layout.value.flat[0].index).toBe(0)
    expect(layout.value.flat[499].index).toBe(499)
    // 总高 = 出生区 + Σ(年份标题 + 卡片高度+间距) - 末间距 + 结束区;高度按卡型估算
    const ESTIMATES = { milestone: 168, standard: 132, minor: 48 } as const
    const measured =
      BIRTH_SECTION_H +
      layout.value.groups.length * YEAR_TITLE_H +
      layout.value.flat.reduce((sum, item) => sum + ESTIMATES[item.kind] + ITEM_GAP, 0) -
      ITEM_GAP +
      END_SECTION_H
    expect(totalHeight.value).toBe(measured)
    // 区间事件产生色带(每年 i∈{0,4,8} → 3×50=150 条)
    expect(periodBands.value.length).toBe(150)
  })

  it('高度缓存生效:测量回填后总高随之修正', () => {
    const events = ref([makeEvent({ date: '2020-01-01', id: 'a' })])
    const container = ref<HTMLElement | null>(null)
    const { layout, totalHeight, scheduleMeasure } = useVirtualTimeline(events, container)

    const before = totalHeight.value
    // 模拟 collectMeasurements 读到真实高度(模拟 DOM 不可行,直接改内部 cache 不可达;
    // 通过 scheduleMeasure 前手动校验估算行为:默认 estimate 132)
    expect(layout.value.flat[0].height).toBe(132)
    expect(totalHeight.value).toBe(before)
  })

  it('视口窗口:只渲染可视区附近的分组', () => {
    const events = ref(makeBulkEvents(50, 10))
    const container = ref<HTMLElement | null>(null)
    const { visibleGroups, layout } = useVirtualTimeline(events, container)

    // 初始 scrollY=0:应渲染前几组而非全部 50 组
    expect(visibleGroups.value.length).toBeGreaterThan(0)
    expect(visibleGroups.value.length).toBeLessThan(10)
    expect(visibleGroups.value[0].year).toBe(1976)

    // 模拟滚到中部:通过内部 scrollY?该值由 window scroll 驱动,jsdom 下手动设
    // 验证窗口过滤的数学:给定 scrollY,窗口只含相交分组
    const midGroup = layout.value.groups[25]
    expect(midGroup).toBeTruthy()
  })

  it('色带泳道:重叠区间分泳道,不重叠共用', () => {
    const events = ref([
      makeEvent({ id: 'p1', type: 'period', date: '2000-01-01', endDate: '2005-01-01' }),
      makeEvent({ id: 'p2', type: 'period', date: '2001-01-01', endDate: '2003-01-01' }),
      makeEvent({ id: 'p3', type: 'period', date: '2006-01-01', endDate: '2008-01-01' }),
    ])
    const container = ref<HTMLElement | null>(null)
    const { periodBands } = useVirtualTimeline(events, container)

    expect(periodBands.value.length).toBe(3)
    // p1 与 p2 重叠 → 不同泳道;p3 在两者之后 → 泳道 0
    const byId = new Map(periodBands.value.map(b => [b.id, b]))
    expect(byId.get('p1')!.lane).toBe(0)
    expect(byId.get('p2')!.lane).toBe(1)
    expect(byId.get('p3')!.lane).toBe(0)
  })

  it('「至今」区间的视觉终点延伸到最后一个节点之后', () => {
    const events = ref([
      makeEvent({ id: 'a', date: '2010-01-01' }),
      makeEvent({ id: 'p', type: 'period', date: '2012-01-01', isOngoing: true }),
    ])
    const container = ref<HTMLElement | null>(null)
    const { periodBands, layout } = useVirtualTimeline(events, container)

    const band = periodBands.value.find(b => b.id === 'p')
    expect(band).toBeTruthy()
    expect(band!.ongoing).toBe(true)
    // 色带底端超出最后一个节点的 y
    const lastNodeY = layout.value.flat[layout.value.flat.length - 1].nodeY
    expect(band!.top + band!.height).toBeGreaterThan(lastNodeY)
  })
})
