<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ProfileCard from '@/components/Profile/ProfileCard.vue'
import ProfileEditor from '@/components/Profile/ProfileEditor.vue'
import AppModal from '@/components/common/AppModal.vue'
import { useUserStore } from '@/stores/userStore'
import { useEventStore } from '@/stores/eventStore'
import type { UserProfile } from '@/types'

const userStore = useUserStore()
const eventStore = useEventStore()
const editing = ref(false)

// 加载事件以显示统计（总事件数）
onMounted(() => {
  if (eventStore.events.length === 0) {
    eventStore.loadEvents()
  }
})

function onSaved(_user: UserProfile) {
  editing.value = false
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
    <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
      个人档案
    </h1>

    <ProfileCard @edit="editing = true" />

    <AppModal v-model="editing" title="编辑个人档案" max-width="max-w-md">
      <ProfileEditor :existing="userStore.user" @saved="onSaved">
        <template #cancel>
          <button
            type="button"
            class="btn-secondary"
            @click="editing = false"
          >
            取消
          </button>
        </template>
      </ProfileEditor>
    </AppModal>
  </div>
</template>
