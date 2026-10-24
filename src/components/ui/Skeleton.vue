<script setup lang="ts">
/** 骨架屏:加载占位 */
interface Props {
  class?: string
}

defineProps<Props>()
</script>

<template>
  <div :class="['animate-pulse rounded-lg bg-app-bg-deep', $props.class]" />
</template>
