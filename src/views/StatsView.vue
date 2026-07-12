<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import { useUserStore } from '@/stores/userStore'
import {
  getOverviewStats,
  getYearlyStats,
  getCategoryStats,
  getMonthlyStats,
} from '@/utils/stats'
import StatsSummaryCards from '@/components/Stats/StatsSummaryCards.vue'
import StatsBarChart from '@/components/Stats/StatsBarChart.vue'
import StatsCategoryChart from '@/components/Stats/StatsCategoryChart.vue'
import StatsMonthHeatmap from '@/components/Stats/StatsMonthHeatmap.vue'

const eventStore = useEventStore()
const userStore = useUserStore()

onMounted(async () => {
  if (userStore.isLoggedIn) {
    await eventStore.loadEvents()
  }
})

// 各项统计（基于全量事件，不受筛选影响）
const overview = computed(() => getOverviewStats(eventStore.events))
const yearly = computed(() => getYearlyStats(eventStore.events))
const category = computed(() => getCategoryStats(eventStore.events))
const monthly = computed(() => getMonthlyStats(eventStore.events))

const isEmpty = computed(() => eventStore.events.length === 0)
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
    <!-- 标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100">
        📊 人生统计
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        从另一个角度看看你的人生轨迹。
      </p>
    </div>

    <!-- 加载中 -->
    <div v-if="eventStore.loading" class="text-center py-20">
      <div class="text-4xl mb-3 animate-pulse">⏳</div>
      <p class="text-sm text-gray-400">加载中…</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="isEmpty" class="card-base p-12 text-center">
      <div class="text-5xl mb-4">🌱</div>
      <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
        还没有事件可统计
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
        先去时间线添加几个人生节点，这里就会展示丰富的统计图表啦。
      </p>
      <RouterLink
        to="/timeline"
        class="btn-primary inline-block"
      >
        前往时间线 →
      </RouterLink>
    </div>

    <!-- 统计内容 -->
    <div v-else class="space-y-8">
      <!-- 总览卡片 -->
      <StatsSummaryCards :stats="overview" :user-age="userStore.userAge" />

      <!-- 年度趋势 -->
      <section class="card-base p-5 sm:p-6">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
            📈 年度事件趋势
          </h2>
          <span class="text-xs text-gray-400 dark:text-gray-500">
            平均每年 {{ overview.avgPerYear }} 件
          </span>
        </div>
        <StatsBarChart :data="yearly" />
      </section>

      <!-- 两栏布局：分类分布 + 月份热力 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 分类分布 -->
        <section class="card-base p-5 sm:p-6">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-5">
            🎨 事件分类分布
          </h2>
          <StatsCategoryChart :data="category" />
        </section>

        <!-- 月份热力 -->
        <section class="card-base p-5 sm:p-6">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-5">
            🗓️ 月份活跃度
          </h2>
          <StatsMonthHeatmap :data="monthly" />
        </section>
      </div>

      <!-- 底部说明 -->
      <p class="text-center text-xs text-gray-400 dark:text-gray-500 pt-4">
        统计基于已记录的全部事件 · 共 {{ overview.total }} 件
      </p>
    </div>
  </div>
</template>
