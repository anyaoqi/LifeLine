<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  variant?: Variant
  size?: Size
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  block?: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  block: false,
})

defineEmits<{ click: [e: MouseEvent] }>()

const variantClass = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'btn-secondary'
    case 'danger':
      return 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 border border-transparent'
    case 'ghost':
      return 'btn-ghost'
    default:
      return 'btn-primary'
  }
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-sm px-3 py-1.5'
    case 'lg':
      return 'text-lg px-6 py-3'
    default:
      return 'px-4 py-2'
  }
})

const classes = computed(() => [
  'rounded-md font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed',
  variantClass.value,
  sizeClass.value,
  props.block ? 'w-full' : '',
])
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :title="title"
    :class="classes"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
