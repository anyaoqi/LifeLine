<script setup lang="ts">
interface Props {
  selected?: boolean
  color?: string
  disabled?: boolean
}

const props = defineProps<Props>()
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="[
      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all',
      selected
        ? 'border-app-accent bg-app-accent-soft text-app-ink'
        : 'border-app-border bg-app-surface text-app-ink-soft hover:border-app-border-strong',
      disabled && 'pointer-events-none opacity-50',
    ]"
    :style="selected && color ? { borderColor: color, color } : undefined"
  >
    <span
      v-if="color"
      class="h-2 w-2 rounded-full"
      :style="{ backgroundColor: color }"
    />
    <slot />
  </button>
</template>
