<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ProfileEditor from '@/components/Profile/ProfileEditor.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useUserStore } from '@/stores/userStore'
import { useEventStore } from '@/stores/eventStore'
import { formatChineseDate, relativeTime } from '@/utils/dateUtils'
import { getCategory } from '@/utils/constants'
import type { UserProfile } from '@/types'

const userStore = useUserStore()
const eventStore = useEventStore()
const router = useRouter()

onMounted(async () => {
  if (userStore.isLoggedIn) {
    await eventStore.loadEvents()
  }
})

function onProfileCreated(_user: UserProfile) {
  // 创建成功后跳转到时间线
  router.push('/timeline')
}

function goTimeline() {
  router.push('/timeline')
}
</script>

<template>
  <!-- 未建档：引导创建档案 -->
  <div v-if="!userStore.isLoggedIn" class="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-16 animate-fade-in">
    <div class="text-center mb-8">
      <div class="text-6xl mb-4">✦</div>
      <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100">
        欢迎来到 Life-Point
      </h1>
      <p class="mt-3 text-gray-500 dark:text-gray-400 leading-relaxed">
        记录、回顾并可视化你的人生轨迹。<br />
        先创建你的个人档案，开始这段旅程吧。
      </p>
    </div>

    <div class="card-base p-6 sm:p-8">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-5">
        创建个人档案
      </h2>
      <ProfileEditor @saved="onProfileCreated" />
    </div>
  </div>

  <!-- 已建档：仪表盘 -->
  <div v-else class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
    <!-- 欢迎 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100">
        你好，{{ userStore.userName }} 👋
      </h1>
      <p class="mt-1 text-gray-500 dark:text-gray-400">
        今天是 {{ formatChineseDate(new Date().toISOString()) }}，你的 {{ userStore.userAge }} 岁。
      </p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
      <div class="card-base p-5">
        <div class="text-3xl font-bold text-primary-500">{{ eventStore.totalCount }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">人生节点</div>
      </div>
      <div class="card-base p-5">
        <div class="text-3xl font-bold text-primary-500">{{ userStore.userAge }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">岁</div>
      </div>
      <div class="card-base p-5 col-span-2 sm:col-span-1">
        <div class="text-3xl font-bold text-primary-500">
          {{ eventStore.latestEvent ? relativeTime(eventStore.latestEvent.date) : '—' }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">最近一次记录</div>
      </div>
    </div>

    <!-- 最近事件 -->
    <div class="card-base p-6 mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">最近事件</h2>
        <AppButton variant="ghost" size="sm" @click="goTimeline">查看全部 →</AppButton>
      </div>

      <div v-if="eventStore.totalCount === 0" class="text-center py-8">
        <div class="text-4xl mb-2">🌱</div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          还没有记录任何事件，去添加第一个吧。
        </p>
      </div>

      <ul v-else class="space-y-3">
        <li
          v-for="event in eventStore.recentEvents.slice(0, 5)"
          :key="event.id"
          class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
          @click="goTimeline"
        >
          <span
            class="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm"
            :style="{ backgroundColor: getCategory(event.category).color + '22' }"
          >
            {{ getCategory(event.category).emoji }}
          </span>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
              {{ event.title }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatChineseDate(event.date) }}
            </div>
          </div>
          <span class="text-xs text-gray-400">{{ relativeTime(event.date) }}</span>
        </li>
      </ul>
    </div>

    <!-- 快速入口 -->
    <div class="flex flex-wrap gap-3">
      <AppButton @click="goTimeline">📖 查看时间线</AppButton>
      <AppButton variant="secondary" @click="router.push('/stats')">📊 人生统计</AppButton>
      <AppButton variant="ghost" @click="router.push('/profile')">👤 个人档案</AppButton>
      <AppButton variant="ghost" @click="router.push('/settings')">⚙️ 设置</AppButton>
    </div>
  </div>
</template>
