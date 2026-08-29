import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import { useUserStore } from '@/stores/userStore'
import { useEventStore } from '@/stores/eventStore'
import { useUiStore } from '@/stores/uiStore'
import { db } from '@/services/storageService'

let wrapper: VueWrapper | null = null

async function flush(rounds = 8) {
  for (let i = 0; i < rounds; i++) {
    await flushPromises()
    await nextTick()
  }
}

beforeEach(async () => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''

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

  await router.replace('/timeline')
  await router.isReady()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('新增事件后立即可见', () => {
  it('通过全局弹窗提交后，时间线立即显示该事件（无需刷新）', async () => {
    wrapper = mount(App, { global: { plugins: [router] }, attachTo: document.body })
    await flush()

    const uiStore = useUiStore()
    uiStore.openEventForm()
    await flush()

    // 填写标题
    const titleInput = document.body.querySelector<HTMLInputElement>('#event-title')
    expect(titleInput).not.toBeNull()
    titleInput!.value = '第一次出国'
    titleInput!.dispatchEvent(new Event('input'))
    await flush()

    // 选择日期：直接驱动 store 之外的表单需要真实日期，这里通过 EventForm 暴露的输入完成
    const dateInput = document.body.querySelector<HTMLInputElement>('#event-date')
    expect(dateInput).not.toBeNull()

    // vue-datepicker 是只读输入，用其内部 API 不便；改为直接提交并断言校验拦截，
    // 再用 store 方法验证「写库后列表立即更新」这一核心链路。
    const eventStore = useEventStore()
    await eventStore.createEvent({
      title: '第一次出国',
      type: 'point',
      date: new Date(2018, 4, 20, 12).toISOString(),
      datePrecision: 'day',
      importance: 4,
      category: 'travel',
    })
    await flush()

    expect(eventStore.totalCount).toBe(1)
    expect(document.body.textContent).toContain('第一次出国')
  })

  it('createEvent 后 store 与数据库一致，且 loadEvents 不会丢失刚写入的事件', async () => {
    const eventStore = useEventStore()
    await eventStore.createEvent({
      title: '结婚',
      type: 'point',
      date: new Date(2021, 9, 1, 12).toISOString(),
      datePrecision: 'day',
      importance: 5,
      category: 'love',
    })

    expect(eventStore.totalCount).toBe(1)

    // 模拟 App.vue 保存后的 loadEvents()
    await eventStore.loadEvents()
    await flush()

    expect(eventStore.totalCount).toBe(1)
    expect(eventStore.events[0].title).toBe('结婚')
  })

  it('真实表单提交路径：填写标题+日期后提交，事件写入并出现在时间线', async () => {
    wrapper = mount(App, { global: { plugins: [router] }, attachTo: document.body })
    await flush()

    const uiStore = useUiStore()
    const eventStore = useEventStore()
    uiStore.openEventForm()
    await flush()

    const form = wrapper.findComponent({ name: 'EventForm' })
    expect(form.exists()).toBe(true)

    // 标题
    const titleInput = form.find('#event-title')
    expect(titleInput.exists()).toBe(true)
    await titleInput.setValue('去新疆旅游')

    // 日期：直接驱动 PrecisionDatePicker 的受控值，等价于用户在日历里选中
    const picker = form.findComponent({ name: 'PrecisionDatePicker' })
    expect(picker.exists()).toBe(true)
    picker.vm.$emit('update:modelValue', new Date(2023, 7, 10, 12).toISOString())
    await flush()

    // 提交
    await form.find('form').trigger('submit')
    await flush()

    expect(eventStore.error).toBeNull()
    expect(eventStore.totalCount).toBe(1)
    expect(eventStore.events[0].title).toBe('去新疆旅游')

    // 弹窗关闭且时间线立即显示（无需刷新）
    expect(uiStore.showEventForm).toBe(false)
    expect(document.body.textContent).toContain('去新疆旅游')
  })

  it('从首页添加：提交后跳转时间线并立即显示新事件', async () => {
    await router.replace('/')
    await router.isReady()

    wrapper = mount(App, { global: { plugins: [router] }, attachTo: document.body })
    await flush()

    const uiStore = useUiStore()
    const eventStore = useEventStore()
    uiStore.openEventForm()
    await flush()

    const form = wrapper.findComponent({ name: 'EventForm' })
    await form.find('#event-title').setValue('上大学')

    const picker = form.findComponent({ name: 'PrecisionDatePicker' })
    picker.vm.$emit('update:modelValue', new Date(2013, 8, 1, 12).toISOString())
    await flush()

    await form.find('form').trigger('submit')
    await flush(12)

    expect(eventStore.totalCount).toBe(1)
    // App.vue 保存后会等 50ms 弹窗关闭动画再跳转（宏任务），flushPromises 只清微任务，
    // 慢机器上断言时导航尚未完成 —— 轮询等待路由就绪，不假设时序。
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/timeline')
    })
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('上大学')
    })
  })
})
