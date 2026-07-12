<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import { useUserStore } from '@/stores/userStore'
import { useEventStore } from '@/stores/eventStore'
import { formatChineseDate } from '@/utils/dateUtils'

const userStore = useUserStore()
const eventStore = useEventStore()

defineEmits<{ edit: [] }>()

const initials = computed(() => userStore.userName.charAt(0).toUpperCase() || '?')

const stats = computed(() => [
  { label: '年龄', value: `${userStore.userAge} 岁` },
  { label: '记录事件', value: `${eventStore.totalCount} 个` },
])
</script>

<template>
  <div class="card-base p-6 sm:p-8 text-center">
    <!-- 头像 -->
    <div
      v-if="userStore.user?.avatar"
      class="w-28 h-28 mx-auto rounded-full overflow-hidden ring-4 ring-primary-100 dark:ring-primary-900/40 shadow-md"
    >
      <img :src="userStore.user.avatar" :alt="userStore.userName" class="w-full h-full object-cover" />
    </div>
    <div
      v-else
      class="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-white flex items-center justify-center text-5xl font-semibold ring-4 ring-primary-100 dark:ring-primary-900/40 shadow-md"
    >
      {{ initials }}
    </div>

    <!-- 姓名 -->
    <h2 class="mt-5 text-2xl font-bold text-gray-800 dark:text-gray-100">
      {{ userStore.userName }}
    </h2>

    <!-- 出生日期 -->
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      🎂 {{ formatChineseDate(userStore.user?.birthDate) }}
    </p>

    <!-- 简介 -->
    <p
      v-if="userStore.user?.bio"
      class="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-md mx-auto"
    >
      {{ userStore.user.bio }}
    </p>

    <!-- 统计 -->
    <div class="mt-6 grid grid-cols-2 gap-3 max-w-xs mx-auto">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-primary-50 dark:bg-gray-700/50 rounded-lg py-3 px-2"
      >
        <div class="text-xl font-bold text-primary-500">{{ stat.value }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ stat.label }}</div>
      </div>
    </div>

    <!-- 操作 -->
    <div class="mt-6">
      <AppButton variant="secondary" size="sm" @click="$emit('edit')">
        ✏️ 编辑档案
      </AppButton>
    </div>
  </div>
</template>
