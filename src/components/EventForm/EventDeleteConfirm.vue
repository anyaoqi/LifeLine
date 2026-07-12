<script setup lang="ts">
import AppButton from '@/components/common/AppButton.vue'

interface Props {
  title: string
}

defineProps<Props>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <div>
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xl">
        ⚠️
      </div>
      <div>
        <p class="text-gray-700 dark:text-gray-200">
          确定要删除这个事件吗？
        </p>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          「{{ title }}」将被永久删除，此操作无法撤销。
        </p>
      </div>
    </div>

    <div class="mt-6 flex justify-end gap-3">
      <AppButton variant="ghost" type="button" @click="emit('cancel')">取消</AppButton>
      <AppButton variant="danger" type="button" @click="emit('confirm')">确认删除</AppButton>
    </div>
  </div>
</template>
