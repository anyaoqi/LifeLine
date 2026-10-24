<script setup lang="ts">
import { CheckCircle2, Info, X, XCircle } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const

const iconColors = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-app-accent',
} as const
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      aria-live="polite"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl border border-app-border bg-app-surface-raised px-3.5 py-2.5 shadow-lg"
        >
          <component
            :is="icons[toast.kind]"
            :size="17"
            :class="iconColors[toast.kind]"
            class="flex-shrink-0"
          />
          <p class="min-w-0 flex-1 text-sm text-app-ink">{{ toast.message }}</p>
          <button
            v-if="toast.action"
            type="button"
            class="flex-shrink-0 rounded-md px-2 py-1 text-sm font-semibold text-app-accent transition-colors hover:bg-app-accent-soft"
            @click="toast.action.handler(); dismiss(toast.id)"
          >
            {{ toast.action.label }}
          </button>
          <button
            type="button"
            class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-app-ink-faint transition-colors hover:bg-app-bg-deep"
            aria-label="关闭提示"
            @click="dismiss(toast.id)"
          >
            <X :size="13" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.25s ease-out;
}
.toast-leave-active {
  transition: all 0.15s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}
.toast-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
