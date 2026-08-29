import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import { defineComponent, h, nextTick } from 'vue'
import TimelinePageView from '@/views/TimelinePageView.vue'
import { useUiStore } from '@/stores/uiStore'

const Blank = defineComponent({ setup: () => () => h('div') })

/** 只 stub 依赖 DOM 测量的重型子组件，保留 AppModal/EventForm 以真实验证弹窗渲染 */
const heavyStubs = {
  TimelineView: Blank,
  TimelineFilter: Blank,
}

function buildRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: Blank },
      { path: '/timeline', name: 'timeline', component: TimelinePageView },
    ],
  })
}

function dialogCount(): number {
  return document.body.querySelectorAll('[role="dialog"]').length
}

let wrapper: VueWrapper | null = null

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

async function mountTimeline(router: Router) {
  await router.push('/timeline')
  await router.isReady()

  wrapper = mount(TimelinePageView, {
    global: { plugins: [router], stubs: heavyStubs },
    attachTo: document.body,
  })

  // onMounted 内部 await 了一次 nextTick，这里多刷新几轮微任务确保其完成
  await nextTick()
  await nextTick()
  await nextTick()
  return wrapper
}

describe('新增事件弹窗', () => {
  it('点击浮动按钮时触发全局弹窗', async () => {
    const uiStore = useUiStore()
    const view = await mountTimeline(buildRouter())

    expect(uiStore.showEventForm).toBe(false)
    await view.get('button[aria-label="添加事件"]').trigger('click')
    await nextTick()

    // 浮动按钮调用 uiStore.openEventForm()，弹窗由 App.vue 全局渲染
    expect(uiStore.showEventForm).toBe(true)
  })

  it('带着 uiStore 新增请求进入时间线页时 showEventForm 为 true', async () => {
    const uiStore = useUiStore()
    uiStore.openEventForm()

    await mountTimeline(buildRouter())

    expect(uiStore.showEventForm).toBe(true)
  })

  it('带着 ?add=1 深链不会被 TimelinePageView 单独处理（全局弹窗负责）', async () => {
    // 这种情况下 TimelinePageView 不再自行打开弹窗
    const router = buildRouter()
    await router.push('/timeline?add=1')
    await router.isReady()

    wrapper = mount(TimelinePageView, {
      global: { plugins: [router], stubs: heavyStubs },
      attachTo: document.body,
    })
    await nextTick()
    await nextTick()

    // 没有本地弹窗——全局弹窗不在此组件内
    expect(dialogCount()).toBe(0)
  })
})
