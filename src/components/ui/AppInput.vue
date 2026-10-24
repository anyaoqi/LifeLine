<script setup lang="ts">
import { useId } from 'vue'

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  type?: string
  required?: boolean
  disabled?: boolean
  maxlength?: number
  error?: string
  hint?: string
  autofocus?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const id = useId()
</script>

<template>
  <div>
    <label
      v-if="label"
      :for="id"
      class="mb-1.5 block text-sm font-medium text-app-ink"
    >
      {{ label }}
      <span v-if="required" class="text-red-400">*</span>
    </label>
    <input
      :id="id"
      :value="modelValue"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :maxlength="maxlength"
      :autofocus="autofocus"
      :class="[
        'w-full rounded-lg border bg-app-surface-raised px-3 py-2 text-app-ink',
        'placeholder:text-app-ink-faint transition-colors',
        error
          ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
          : 'border-app-border-strong focus:border-app-accent focus:ring-2 focus:ring-app-accent/20',
        disabled && 'opacity-50',
      ]"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-app-ink-faint">{{ hint }}</p>
  </div>
</template>
