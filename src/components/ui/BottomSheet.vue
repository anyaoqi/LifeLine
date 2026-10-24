<script setup lang="ts">
import { watch } from 'vue'
import { X } from 'lucide-vue-next'

/**
 * 底部弹层:移动端主要交互容器(录入、详情、筛选),
 * 桌面端自动呈现为底部居中浮出面板。拖拽把手纯装饰。
 */
interface Props {
  modelValue: boolean
  title?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

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
</script>

<template>
  <Teleport to="body">
    <div @keydown="onKeydown">
      <Transition name="sheet">
        <div
          v-if="modelValue"
          class="fixed inset-0 z-50 flex items-end justify-center sm:items-end sm:justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            class="absolute inset-0 bg-[#2a2622]/45 backdrop-blur-[2px]"
            @click="close"
          />

          <div
            class="relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl bg-app-surface shadow-lg sm:max-w-lg sm:rounded-2xl"
          >
            <!-- 把手 -->
            <div class="flex justify-center pt-2.5 sm:hidden">
              <span class="h-1 w-10 rounded-full bg-app-border-strong" />
            </div>

            <div
              v-if="title"
              class="flex items-center justify-between border-b border-app-border px-5 py-3.5"
            >
              <h2 class="font-display text-lg font-semibold text-app-ink">
                {{ title }}
              </h2>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full text-app-ink-faint transition-colors hover:bg-app-bg-deep hover:text-app-ink"
                aria-label="关闭"
                @click="close"
              >
                <X :size="18" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto px-5 py-4">
              <slot />
            </div>

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
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}
.sheet-enter-active > div:last-child,
.sheet-leave-active > div:last-child {
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from > div:last-child,
.sheet-leave-to > div:last-child {
  transform: translateY(60%);
}
</style>
