<script setup lang="ts">
import { useId, onBeforeUnmount, watch } from 'vue'
import { X } from 'lucide-vue-next'

/**
 * 中央模态框:Teleport 到 body,背景模糊,Esc/点击遮罩关闭,锁定页面滚动。
 * 移动端体验由 BottomSheet 承担;本组件面向桌面与表单类弹窗。
 */
interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg'
  hideClose?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const id = useId()

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) close()
}

watch(
  () => props.modelValue,
  (open) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
  },
)

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})

const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const
</script>

<template>
  <Teleport to="body">
    <div @keydown="onKeydown">
      <Transition name="modal">
        <div
          v-if="modelValue"
          class="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          role="dialog"
          :aria-labelledby="title ? `${id}-title` : undefined"
          aria-modal="true"
        >
          <!-- 遮罩 -->
          <div
            class="absolute inset-0 bg-[#2a2622]/45 backdrop-blur-[2px]"
            @click="close"
          />

          <!-- 面板 -->
          <div
            :class="[
              'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-app-surface shadow-lg sm:rounded-2xl',
              'animate-slide-up sm:animate-scale-in',
              sizeClass[size ?? 'md'],
            ]"
          >
            <!-- 头部 -->
            <div
              v-if="title || !hideClose"
              class="flex items-center justify-between gap-3 border-b border-app-border px-5 py-4"
            >
              <h2
                v-if="title"
                :id="`${id}-title`"
                class="font-display text-lg font-semibold text-app-ink"
              >
                {{ title }}
              </h2>
              <button
                v-if="!hideClose"
                type="button"
                class="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-app-ink-faint transition-colors hover:bg-app-bg-deep hover:text-app-ink"
                aria-label="关闭"
                @click="close"
              >
                <X :size="18" />
              </button>
            </div>

            <!-- 内容 -->
            <div class="flex-1 overflow-y-auto px-5 py-5">
              <slot />
            </div>

            <!-- 底部操作(可选) -->
            <div v-if="$slots.footer" class="border-t border-app-border px-5 py-3.5">
              <slot name="footer" />
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-enter-active {
  transition: opacity 0.2s ease;
}
.modal-leave-active {
  transition: opacity 0.15s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
