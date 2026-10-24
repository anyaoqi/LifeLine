import { readonly, ref } from 'vue'

/**
 * 全局 Toast:替代散落各页的错误提示与 DeleteUndoToast。
 * 支持 action(如「撤销」)与倒计时进度(undo 撤销窗口)。
 */
export interface ToastAction {
  label: string
  handler: () => void | Promise<void>
}

export interface Toast {
  id: number
  kind: 'success' | 'error' | 'info'
  message: string
  /** 可选操作按钮(如撤销);配置后 toast 不会自动消失,由调用方在 handler 中关闭 */
  action?: ToastAction
  /** 自动关闭时长(ms);默认 3000,传 Infinity 表示常驻直到手动关闭 */
  duration?: number
  /** 倒计时进度条(0-100),仅带 action 的撤销类 toast 使用 */
  progress?: number
}

const toasts = ref<Toast[]>([])
let nextId = 1

export function useToast() {
  function dismiss(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function show(
    toast: Omit<Toast, 'id'>,
  ): number {
    const id = nextId++
    const entry: Toast = { id, ...toast }
    toasts.value.push(entry)
    const duration = entry.action ? Infinity : (entry.duration ?? 3000)
    if (Number.isFinite(duration)) {
      setTimeout(() => dismiss(id), duration)
    }
    // 超过 4 条时丢弃最旧的
    if (toasts.value.length > 4) toasts.value.shift()
    return id
  }

  function success(message: string, duration?: number) {
    return show({ kind: 'success', message, duration })
  }

  function error(message: string) {
    return show({ kind: 'error', message })
  }

  function info(message: string, duration?: number) {
    return show({ kind: 'info', message, duration })
  }

  function withAction(
    message: string,
    action: ToastAction,
    options?: { duration?: number },
  ) {
    return show({ kind: 'info', message, action, duration: options?.duration })
  }

  return {
    toasts: readonly(toasts),
    show,
    success,
    error,
    info,
    withAction,
    dismiss,
  }
}
