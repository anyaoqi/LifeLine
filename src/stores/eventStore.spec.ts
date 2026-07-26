import { describe, expect, it, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/userStore'
import { useEventStore } from '@/stores/eventStore'
import { db, eventService } from '@/services/storageService'
import type { LifeEvent } from '@/types'

beforeEach(async () => {
  setActivePinia(createPinia())
  const userStore = useUserStore()
  userStore.user = {
    id: 'u1',
    name: '测试用户',
    birthDate: '1995-06-15T12:00:00.000Z',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  }
  if (!db.isOpen()) await db.open()
  await db.events.clear()
  vi.restoreAllMocks()
})

describe('loadEvents 竞态安全', () => {
  it('页面加载时仍在进行中的 loadEvents 不能覆盖之后新增的事件', async () => {
    const eventStore = useEventStore()

    // 模拟真实浏览器中较慢的一次初始加载：返回「新增之前」的空快照
    let resolveSlowLoad: (value: LifeEvent[]) => void = () => {}
    const slowLoad = new Promise<LifeEvent[]>((resolve) => {
      resolveSlowLoad = resolve
    })
    const spy = vi
      .spyOn(eventService, 'getEventsByUserSorted')
      .mockReturnValueOnce(slowLoad)

    // 进入页面：加载开始但尚未返回
    const loading = eventStore.loadEvents()

    // 用户此时新增了一个事件（写库 + 更新内存列表）
    await eventStore.createEvent({
      title: '第一次出国',
      type: 'point',
      date: new Date(2018, 4, 20, 12).toISOString(),
      datePrecision: 'day',
      importance: 4,
      category: 'travel',
    })
    expect(eventStore.totalCount).toBe(1)

    // 迟到的旧快照返回
    resolveSlowLoad([])
    await loading

    // 新增事件不能因为迟到的旧结果而消失
    expect(eventStore.totalCount).toBe(1)
    expect(eventStore.events[0].title).toBe('第一次出国')

    spy.mockRestore()
  })

  it('后发起的加载结果优先于先发起但迟到的加载结果', async () => {
    const eventStore = useEventStore()

    const stale: LifeEvent[] = []
    const fresh = [
      {
        id: 'e1',
        userId: 'u1',
        title: '结婚',
        type: 'point',
        date: new Date(2021, 9, 1, 12).toISOString(),
        datePrecision: 'day',
        importance: 5,
        category: 'love',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as LifeEvent,
    ]

    let resolveStale: (value: LifeEvent[]) => void = () => {}
    const stalePromise = new Promise<LifeEvent[]>((resolve) => {
      resolveStale = resolve
    })

    const spy = vi
      .spyOn(eventService, 'getEventsByUserSorted')
      .mockReturnValueOnce(stalePromise)
      .mockResolvedValueOnce(fresh)

    const first = eventStore.loadEvents()
    const second = eventStore.loadEvents()
    await second

    resolveStale(stale)
    await first

    expect(eventStore.totalCount).toBe(1)
    expect(eventStore.events[0].title).toBe('结婚')

    spy.mockRestore()
  })
})
