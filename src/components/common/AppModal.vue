<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  // 点击遮罩是否关闭
  closeOnOverlay?: boolean
  // 是否显示关闭按钮
  showClose?: boolean
  // 内容区最大宽度
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  closeOnOverlay: true,
  showClose: true,
  maxWidth: 'max-w-lg',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onOverlayClick() {
  if (props.closeOnOverlay) close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) close()
}

// 监听打开状态，控制 body 滚动锁与键盘事件
watch(
  () => props.modelValue,
  (open) => {
    if (typeof document === 'undefined') return
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', onKeydown)
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeydown)
    }
  }
)

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <!-- 遮罩 -->
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="onOverlayClick"
        />

        <!-- 模态框主体 -->
        <div
          :class="['relative w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg', maxWidth]"
          class="animate-scale-in"
        >
          <!-- 标题栏 -->
          <div
            v-if="title || showClose"
            class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700"
          >
            <h3 v-if="title" class="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {{ title }}
            </h3>
            <button
              v-if="showClose"
              type="button"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded"
              aria-label="关闭"
              @click="close"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 内容区 -->
          <div class="px-6 py-5 max-h-[70vh] overflow-y-auto">
            <slot />
          </div>

          <!-- 底部按钮区（可选） -->
          <div
            v-if="$slots.footer"
            class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
