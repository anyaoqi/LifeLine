<script setup lang="ts">
import { computed } from 'vue'
import { Star } from 'lucide-vue-next'
import { IMPORTANCE_MAP } from '@/utils/constants'
import type { Importance } from '@/types'

/** 重要程度星级选择器:1-5 星,含当前档位文案 */
interface Props {
  modelValue: Importance
  compact?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: Importance] }>()

const label = computed(() => IMPORTANCE_MAP[props.modelValue]?.label ?? '')
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="flex" role="radiogroup" aria-label="重要程度">
      <button
        v-for="level in [1, 2, 3, 4, 5] as const"
        :key="level"
        type="button"
        role="radio"
        :aria-checked="modelValue === level"
        :title="IMPORTANCE_MAP[level]?.desc"
        class="p-0.5 transition-transform hover:scale-110 active:scale-95"
        @click="emit('update:modelValue', level)"
      >
        <Star
          :size="compact ? 15 : 18"
          :class="
            level <= modelValue
              ? 'fill-app-accent text-app-accent'
              : 'text-app-border-strong'
          "
        />
      </button>
    </div>
    <span v-if="label" class="text-xs font-medium text-app-ink-soft">{{ label }}</span>
  </div>
</template>
