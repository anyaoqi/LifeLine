import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/uiStore'

/** 文本输入场景下不响应全局快捷键 */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  )
}

/**
 * 全局键盘快捷键:
 *  - `/`  聚焦时间线搜索(不在首页则先跳转)
 *  - `n`  新建记录
 */
export function useGlobalShortcuts() {
  const router = useRouter()

  function onKeydown(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (isTyping(e.target)) return

    const uiStore = useUiStore()
    if (e.key === '/') {
      e.preventDefault()
      if (router.currentRoute.value.path !== '/') void router.push('/')
      uiStore.requestSearchFocus()
    } else if (e.key === 'n' || e.key === 'N') {
      e.preventDefault()
      uiStore.openEventForm()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}
