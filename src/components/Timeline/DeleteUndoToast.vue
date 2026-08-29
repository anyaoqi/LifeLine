<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// 删除成功后弹出：30 秒倒计时内可一键撤销，进度条同步收缩示意剩余时间。
const props = withDefaults(defineProps<{ title: string; windowMs?: number }>(), {
  windowMs: 30_000,
})
const emit = defineEmits<{ undo: []; dismiss: [] }>()

const remaining = ref(Math.round(props.windowMs / 1000))
let timer: number | null = null

onMounted(() => {
  timer = window.setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) emit('dismiss')
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer !== null) clearInterval(timer)
})
</script>

<template>
  <div
    class="fixed bottom-6 left-4 right-20 sm:right-auto z-40 animate-fade-in"
    role="status"
    aria-live="polite"
  >
    <div class="max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="flex items-center gap-3 px-4 py-3">
        <span class="text-lg flex-shrink-0">🗑️</span>
        <p class="flex-1 min-w-0 text-sm text-gray-700 dark:text-gray-200 truncate">
          已删除「{{ title }}」
          <span class="text-gray-400 dark:text-gray-500">({{ remaining }}s)</span>
        </p>
        <button
          type="button"
          class="flex-shrink-0 rounded-md bg-primary-400 hover:bg-primary-500 text-white text-sm font-medium px-3 py-1.5 transition-colors"
          @click="emit('undo')"
        >
          撤销
        </button>
        <button
          type="button"
          class="flex-shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="关闭"
          aria-label="关闭删除提示"
          @click="emit('dismiss')"
        >
          ✕
        </button>
      </div>
      <!-- 剩余时间进度条 -->
      <div class="h-0.5 bg-gray-100 dark:bg-gray-700" aria-hidden="true">
        <div
          class="h-full bg-primary-400 undo-progress"
          :style="{ animationDuration: `${props.windowMs}ms` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.undo-progress {
  transform-origin: left;
  animation-name: undo-shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes undo-shrink {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

@media (prefers-reduced-motion: reduce) {
  .undo-progress {
    animation: none;
    transform: none;
  }
}
</style>
