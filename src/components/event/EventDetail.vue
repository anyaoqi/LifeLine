<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Clock, Heart, MapPin, Pencil, Trash2, Users } from 'lucide-vue-next'
import AppModal from '@/components/ui/AppModal.vue'
import { getCategory } from '@/utils/constants'
import {
  formatChineseDate,
  formatDateRange,
  calcDuration,
  formatAgeAtDate,
  relativeTime,
} from '@/utils/dateUtils'
import { imageService, imageUrl, forgetImageUrls } from '@/services/imageService'
import type { StoredImage } from '@/services/storageService'
import { useUserStore } from '@/stores/userStore'
import type { LifeEvent } from '@/types'

/**
 * 事件详情弹层:点击时间线卡片打开,完整呈现一条记录
 * (如实日期、年龄、时长、地点、参与人、心情、照片)。
 */
const props = defineProps<{ event: LifeEvent | null; open: boolean }>()
const emit = defineEmits<{
  close: []
  edit: [event: LifeEvent]
  delete: [event: LifeEvent]
}>()

const userStore = useUserStore()
const images = ref<StoredImage[]>([])
const lightboxUrl = ref<string | null>(null)

watch(
  () => [props.open, props.event?.id] as const,
  async ([open, id]) => {
    if (open && id) {
      try {
        images.value = await imageService.getByEvent(id)
      } catch {
        images.value = []
      }
    } else if (!open) {
      forgetImageUrls(images.value.map(i => i.id))
      images.value = []
      lightboxUrl.value = null
    }
  },
  { immediate: true },
)

const category = computed(() => getCategory(props.event?.category))
const dateText = computed(() => {
  const e = props.event
  if (!e) return ''
  if (e.type === 'period') {
    return formatDateRange(e.date, e.endDate, e.datePrecision, e.endDatePrecision, e.isOngoing === true)
  }
  return formatChineseDate(e.date, e.datePrecision)
})
const durationText = computed(() => {
  const e = props.event
  if (!e || e.type !== 'period') return ''
  return calcDuration(e.date, e.endDate, e.isOngoing === true)
})
const ageText = computed(() =>
  formatAgeAtDate(userStore.user?.birthDate, props.event?.date, props.event?.datePrecision),
)
const metaRows = computed(() => {
  const e = props.event
  if (!e) return []
  const rows: { icon: typeof MapPin; label: string; value: string }[] = []
  if (e.location) rows.push({ icon: MapPin, label: '地点', value: e.location })
  if (e.participants?.length) rows.push({ icon: Users, label: '参与人', value: e.participants.join('、') })
  if (e.mood) rows.push({ icon: Heart, label: '心情', value: e.mood })
  if (e.createdAt) rows.push({ icon: Clock, label: '记录于', value: relativeTime(e.createdAt) })
  return rows
})
</script>

<template>
  <AppModal
    :model-value="open"
    :title="undefined"
    max-width="max-w-xl"
    @update:model-value="(v: boolean) => { if (!v) emit('close') }"
    @close="emit('close')"
  >
    <div v-if="event" class="detail">
      <!-- 头部:分类色块 + 衬线标题 -->
      <div class="flex items-start gap-3">
        <span
          class="mt-1.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
          :style="{ backgroundColor: category.color + '1f', color: category.color }"
        >
          <component :is="category.icon" :size="20" :stroke-width="1.8" />
        </span>
        <div class="min-w-0">
          <h2 class="font-display text-2xl font-bold leading-snug text-app-ink">
            {{ event.title }}
          </h2>
          <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-app-ink-soft">
            <span class="font-medium" :style="{ color: category.color }">{{ category.label }}</span>
            <span>{{ dateText }}</span>
            <span v-if="ageText" class="text-app-ink-faint">{{ ageText }}</span>
            <span
              v-if="durationText"
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :style="{ backgroundColor: category.color + '1f', color: category.color }"
            >
              {{ event.isOngoing ? '至今' : durationText }}
            </span>
          </div>
        </div>
      </div>

      <!-- 描述 -->
      <p v-if="event.description" class="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-app-ink">
        {{ event.description }}
      </p>

      <!-- 元信息行 -->
      <dl v-if="metaRows.length" class="mt-4 space-y-2 rounded-xl bg-app-bg-deep/70 p-4">
        <div v-for="row in metaRows" :key="row.label" class="flex items-center gap-2.5 text-sm">
          <component :is="row.icon" :size="15" class="flex-shrink-0 text-app-ink-faint" />
          <dt class="w-14 flex-shrink-0 text-xs text-app-ink-faint">{{ row.label }}</dt>
          <dd class="min-w-0 flex-1 text-app-ink">{{ row.value }}</dd>
        </div>
      </dl>

      <!-- 照片画廊 -->
      <div v-if="images.length" class="mt-4">
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <button
            v-for="img in images"
            :key="img.id"
            type="button"
            class="aspect-square overflow-hidden rounded-lg border border-app-border"
            @click="lightboxUrl = imageUrl(img)"
          >
            <img :src="imageUrl(img)" alt="事件照片" class="h-full w-full object-cover transition-transform hover:scale-105" />
          </button>
        </div>
      </div>

      <!-- 操作 -->
      <div class="mt-6 flex items-center justify-end gap-2">
        <button
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-app-ink-soft transition-colors hover:bg-app-bg-deep hover:text-app-ink"
          @click="emit('close')"
        >
          关闭
        </button>
        <button
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-app-border-strong px-3.5 text-sm font-medium text-app-ink transition-colors hover:bg-app-bg-deep"
          @click="emit('edit', event)"
        >
          <Pencil :size="14" /> 编辑
        </button>
        <button
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600/90 px-3.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
          @click="emit('delete', event)"
        >
          <Trash2 :size="14" /> 删除
        </button>
      </div>
    </div>
  </AppModal>

  <!-- 灯箱 -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="lightboxUrl"
        class="fixed inset-0 z-[80] flex items-center justify-center bg-[#14110e]/90 p-8"
        @click="lightboxUrl = null"
      >
        <img :src="lightboxUrl" alt="查看照片" class="max-h-full max-w-full rounded-lg object-contain" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
