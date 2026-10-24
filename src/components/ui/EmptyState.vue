<script setup lang="ts">
import type { Component } from 'vue'

/** 空状态:纸面风格插画位 + 行动按钮 */
interface Props {
  icon?: Component
  title: string
  description?: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div
      class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-app-bg-deep text-app-ink-faint"
    >
      <component :is="icon" v-if="icon" :size="26" :stroke-width="1.5" />
      <slot v-else name="icon" />
    </div>
    <h3 class="font-display text-lg font-semibold text-app-ink">{{ title }}</h3>
    <p v-if="description" class="mt-1.5 max-w-xs text-sm leading-relaxed text-app-ink-soft">
      {{ description }}
    </p>
    <div v-if="$slots.action" class="mt-5">
      <slot name="action" />
    </div>
  </div>
</template>
