<script setup lang="ts">
/** 分段器:互斥单选,纸面风格的轻量控件(点/区间、精度、密度切换共用) */
interface Option<T extends string | number> {
  value: T
  label: string
  hint?: string
}

interface Props {
  options: Option<string | number>[]
  modelValue: string | number
  size?: 'sm' | 'md'
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()
</script>

<template>
  <div
    class="inline-flex rounded-lg bg-app-bg-deep p-0.5"
    role="radiogroup"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="modelValue === option.value"
      :title="option.hint"
      :class="[
        'rounded-[6px] font-medium transition-all',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        modelValue === option.value
          ? 'bg-app-surface-raised text-app-ink shadow-sm'
          : 'text-app-ink-faint hover:text-app-ink-soft',
      ]"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
