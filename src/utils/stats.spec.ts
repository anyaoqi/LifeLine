import { describe, expect, it } from 'vitest'
import { getLifeRatio, getOnThisDay, getYearlyStats } from './stats'
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

describe('getLifeRatio 人生比例', () => {
  const birth = '1995-06-15T12:00:00.000Z'

  it('无出生日期或无数据时为空', () => {
    expect(getLifeRatio([], birth).items).toEqual([])
    expect(getLifeRatio([makeEvent({ date: '2000-01-01' })], null).items).toEqual([])
  })

  it('时间点事件不计入比例,区间事件按月数折年', () => {
    const events = [
      makeEvent({ date: '2001-09-01', type: 'point' }),
      makeEvent({
        title: '小学',
        type: 'period',
        date: '2001-09-01T12:00:00.000Z',
        endDate: '2007-09-01T12:00:00.000Z',
        category: 'education',
      }),
    ]
    const { items, totalYears } = getLifeRatio(events, birth)
    expect(totalYears).toBeGreaterThan(25)
    const edu = items.find(i => i.key === 'education')
    expect(edu).toBeTruthy()
    expect(edu!.years).toBeCloseTo(6, 0)
    expect(edu!.percentage).toBeCloseTo((6 / totalYears) * 100, 0)
  })

  it('「至今」区间计算到当前,未来起点被夹掉', () => {
    const events = [
      makeEvent({
        title: '工作至今',
        type: 'period',
        date: '2018-07-01T12:00:00.000Z',
        isOngoing: true,
        category: 'work',
      }),
      makeEvent({
        title: '未来阶段',
        type: 'period',
        date: '2040-01-01T12:00:00.000Z',
        endDate: '2045-01-01T12:00:00.000Z',
        category: 'life',
      }),
    ]
    const { items } = getLifeRatio(events, birth)
    expect(items.find(i => i.key === 'work')).toBeTruthy()
    expect(items.find(i => i.key === 'life')).toBeUndefined()
  })
})

describe('getOnThisDay 那年今日', () => {
  it('day 精度比对月+日,month 精度只比对月,year 不参与', () => {
    const now = new Date(2024, 5, 15) // 6月15日
    const events = [
      makeEvent({ title: '同月同日', date: '2010-06-15T12:00:00.000Z', datePrecision: 'day' }),
      makeEvent({ title: '同月不同日', date: '2012-06-20T12:00:00.000Z', datePrecision: 'day' }),
      makeEvent({ title: '同月的月精度', date: '2015-06-01T12:00:00.000Z', datePrecision: 'month' }),
      makeEvent({ title: '同年精度', date: '2018-06-15T12:00:00.000Z', datePrecision: 'year' }),
      makeEvent({ title: '不同月', date: '2019-07-15T12:00:00.000Z', datePrecision: 'day' }),
    ]
    const items = getOnThisDay(events, now)
    expect(items.map(i => i.event.title)).toEqual(['同月同日', '同月的月精度'])
    expect(items[0].year).toBe(2010)
  })

  it('按年份升序', () => {
    const now = new Date(2024, 0, 1)
    const events = [
      makeEvent({ date: '2020-01-01T12:00:00.000Z' }),
      makeEvent({ date: '2001-01-01T12:00:00.000Z' }),
    ]
    const years = getOnThisDay(events, now).map(i => i.year)
    expect(years).toEqual([2001, 2020])
  })
})

describe('getYearlyStats 空年份补全', () => {
  it('中间无事件的年份补 0,柱状图连续', () => {
    const events = [
      makeEvent({ date: '2000-01-01' }),
      makeEvent({ date: '2003-01-01' }),
    ]
    const stats = getYearlyStats(events)
    expect(stats.map(s => s.year)).toEqual([2000, 2001, 2002, 2003])
    expect(stats[1].count).toBe(0)
  })
})
