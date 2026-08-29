import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'

let wrapper: VueWrapper | null = null

function dialogTitles(): string[] {
  return Array.from(document.body.querySelectorAll('[role="dialog"] h3')).map(
    node => node.textContent?.trim() ?? '',
  )
}

async function flush(rounds = 6) {
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
  await router.replace('/')
  await router.isReady()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('全站「添加事件」入口（全局弹窗）', () => {
  it('从首页点击顶部添加事件按钮后弹出新增表单', async () => {
    wrapper = mount(App, {
      global: { plugins: [router] },
      attachTo: document.body,
    })
    await flush()

    expect(dialogTitles()).toEqual([])

    // Header 的添加按钮现在是 <button>
    const addButtons = wrapper.findAll('button[title="添加事件"]')
    expect(addButtons.length).toBeGreaterThan(0)
    await addButtons[0].trigger('click')
    await flush()

    expect(dialogTitles()).toContain('添加事件')
  })

  it('从首页快捷区域点击添加事件同样弹出新增表单', async () => {
    wrapper = mount(App, {
      global: { plugins: [router] },
      attachTo: document.body,
    })
    await flush()

    const homeAddButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('添加事件'))
    expect(homeAddButton).toBeDefined()
    await homeAddButton!.trigger('click')
    await flush()

    expect(dialogTitles()).toContain('添加事件')
  })

  it('直接调用 uiStore.openEventForm() 弹出弹窗', async () => {
    wrapper = mount(App, {
      global: { plugins: [router] },
      attachTo: document.body,
    })
    await flush()

    const uiStore = useUiStore()
    uiStore.openEventForm()
    await flush()

    expect(dialogTitles()).toContain('添加事件')
  })
})
