<script setup lang="ts">
import { computed } from 'vue'

/**
 * 统一按钮:语义色跟随 --app-* 运行时变量,暗色自动适配。
 * variant:
 *  - primary   暖棕实心(主操作)
 *  - secondary 描边(次操作)
 *  - ghost     无底(弱操作)
 *  - danger    危险操作
 *  - subtle    纸面深一度的弱实心
 */
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
})

const sizeClass = computed(
  () =>
    ({
      xs: 'h-7 px-2.5 text-xs gap-1 rounded-md',
      sm: 'h-8 px-3 text-sm gap-1.5 rounded-md',
      md: 'h-10 px-4 text-sm gap-2 rounded-lg',
      lg: 'h-11 px-5 text-base gap-2 rounded-lg',
    })[props.size],
)

const variantClass = computed(
  () =>
    ({
      primary:
        'bg-app-accent text-white shadow-sm hover:brightness-95 active:scale-[0.98]',
      secondary:
        'border border-app-border-strong text-app-ink bg-app-surface hover:bg-app-bg-deep active:scale-[0.98]',
      ghost: 'text-app-ink-soft hover:bg-app-bg-deep hover:text-app-ink',
      danger:
        'bg-red-600/90 text-white hover:bg-red-600 active:scale-[0.98]',
      subtle: 'bg-app-bg-deep text-app-ink hover:bg-app-border active:scale-[0.98]',
    })[props.variant],
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent',
      'disabled:pointer-events-none disabled:opacity-50',
      sizeClass,
      variantClass,
      block && 'w-full',
    ]"
  >
    <span
      v-if="loading"
      class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
