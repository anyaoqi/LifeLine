<script setup lang="ts">
import { ListTodo } from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'
</script>

<template>
  <div class="mx-auto w-full max-w-5xl animate-fade-in px-4 py-8 sm:px-6">
    <EmptyState
      :icon="ListTodo"
      title="整理视图"
      description="表格化地浏览、编辑与批量整理你的人生记录,即将上线。"
    />
  </div>
</template>
