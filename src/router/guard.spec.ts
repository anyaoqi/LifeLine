import { describe, expect, it, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { useUserStore } from '@/stores/userStore'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('路由守卫诊断', () => {
  // 首次导航需要编译懒加载的路由 chunk，耗时明显高于普通用例
  it('已建档用户可以进入 /timeline', async () => {
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
    expect(userStore.isLoggedIn).toBe(true)

    const failure = await router.push('/timeline')
    expect(failure ?? null).toBeNull()
    expect(router.currentRoute.value.path).toBe('/timeline')
  }, 20000)

  it('未建档用户访问 /timeline 会被引导回首页', async () => {
    await router.replace('/')
    await router.isReady()

    await router.push('/timeline')
    expect(router.currentRoute.value.path).toBe('/')
  })
})
