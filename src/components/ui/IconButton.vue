<script setup lang="ts">
import type { Component } from 'vue'

/** 方形图标按钮 */
interface Props {
  icon: Component
  label: string
  size?: 'sm' | 'md'
  active?: boolean
}

const props = defineProps<Props>()
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    :title="label"
    :class="[
      'inline-flex items-center justify-center rounded-lg transition-colors',
      size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
      active
        ? 'bg-app-accent-soft text-app-accent'
        : 'text-app-ink-soft hover:bg-app-bg-deep hover:text-app-ink',
    ]"
  >
    <component :is="icon" :size="size === 'sm' ? 16 : 18" :stroke-width="1.8" />
  </button>
</template>
