<script setup lang="ts">
import { useUserStore } from '@/stores/userStore'
import WelcomePanel from '@/components/Profile/WelcomePanel.vue'
import TimelinePageView from './TimelinePageView.vue'

/**
 * 首页 = 时间线。未建档时呈现欢迎/建档引导;
 * 建档成功后 userStore.isLoggedIn 变化,本组件自动切换为时间线,无需跳转。
 */
const userStore = useUserStore()
</script>

<template>
  <WelcomePanel v-if="!userStore.isLoggedIn" />
  <TimelinePageView v-else />
</template>
