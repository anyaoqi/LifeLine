<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import ProfileEditor from '@/components/Profile/ProfileEditor.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { useEventStore } from '@/stores/eventStore'
import { formatChineseDate, relativeTime } from '@/utils/dateUtils'
import { getCategory } from '@/utils/constants'
import type { UserProfile } from '@/types'

const userStore = useUserStore()
const uiStore = useUiStore()
const eventStore = useEventStore()
const router = useRouter()

onMounted(async () => {
  if (userStore.isLoggedIn) {
    await eventStore.loadEvents()
  }
})

// 建档状态可能在已停留于首页时才变为 true（欢迎页表单提交成功即是如此，
// 此时 onMounted 早已执行完毕不会重跑）。用 watch 兜底加载事件，
// 避免仪表盘因 events 为空而显示空白/旧数据；切走再切回才有内容正是这个原因。
watch(
  () => userStore.isLoggedIn,
  async (loggedIn) => {
    if (!loggedIn) return
    await eventStore.loadEvents().catch(() => {})
    // 若 ProfileEditor 的 saved 回调因 v-if 卸载时序丢失导致仍停留在首页，
    // 在此补一次跳转，保证建档后一定离开欢迎页到达时间线。
    if (router.currentRoute.value.path === '/') {
      await router.push('/timeline').catch(() => {})
    }
  },
)

async function onProfileCreated(_user: UserProfile) {
  // 首选路径：emit 正常送达时立即加载并跳转；watch 会做幂等的二次兜底。
  await eventStore.loadEvents().catch(() => {})
  if (router.currentRoute.value.path !== '/timeline') {
    await router.push('/timeline').catch(() => {})
  }
}

function goTimeline() {
  router.push('/timeline')
}

function addEvent() {
  uiStore.openEventForm()
}
</script>

<template>
  <!-- 未建档：引导创建档案（桌面端左右布局：欢迎语在左，表单在右） -->
  <div v-if="!userStore.isLoggedIn" class="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 animate-fade-in">
    <div class="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
      <div class="text-center lg:text-left">
        <div class="text-6xl mb-4">✦</div>
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">
          欢迎来到 Life-Point
        </h1>
        <p class="mt-3 text-gray-500 dark:text-gray-400 leading-relaxed">
          记录、回顾并可视化你的人生轨迹。<br />
          先创建你的个人档案，开始这段旅程吧。
        </p>
      </div>

      <div class="card-base p-6 sm:p-8">
        <ProfileEditor @saved="onProfileCreated" />
      </div>
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
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          还没有记录任何事件，从第一个人生节点开始吧。
        </p>
        <AppButton size="sm" @click="addEvent">＋ 添加第一个事件</AppButton>
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
      <AppButton @click="addEvent">＋ 添加事件</AppButton>
      <AppButton variant="secondary" @click="goTimeline">📖 查看时间线</AppButton>
      <AppButton variant="ghost" @click="router.push('/stats')">📊 人生统计</AppButton>
      <AppButton variant="ghost" @click="router.push('/profile')">👤 个人档案</AppButton>
      <AppButton variant="ghost" @click="router.push('/settings')">⚙️ 设置</AppButton>
    </div>
  </div>
</template>
