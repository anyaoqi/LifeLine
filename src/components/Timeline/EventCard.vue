<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, MapPin, Pencil, Trash2 } from 'lucide-vue-next'
import { getCategory } from '@/utils/constants'
import { formatDateRange, calcDuration, formatAgeAtDate } from '@/utils/dateUtils'
import { useUserStore } from '@/stores/userStore'
import type { LifeEvent } from '@/types'

/**
 * 时间线卡片,按重要程度三档呈现:
 *  - milestone(≥5) 里程碑大卡:衬线标题 + 分类色左标 + 完整信息
 *  - standard(3-4) 标准卡
 *  - minor(1-2)   轻量单行
 * 高度参与虚拟滚动布局,根元素务必带 data-measure-key。
 */
const props = defineProps<{ event: LifeEvent; measureKey?: string }>()
const emit = defineEmits<{ edit: [event: LifeEvent]; delete: [event: LifeEvent] }>()

const userStore = useUserStore()
const category = computed(() => getCategory(props.event.category))
const kind = computed(() => (props.event.importance ?? 3) >= 5
  ? 'milestone'
  : (props.event.importance ?? 3) <= 2 ? 'minor' : 'standard')

const dateText = computed(() => {
  const e = props.event
  if (e.type === 'period') {
    return formatDateRange(e.date, e.endDate, e.datePrecision, e.endDatePrecision, e.isOngoing === true)
  }
  return formatDateRange(e.date, undefined, e.datePrecision)
})

const durationText = computed(() => {
  const e = props.event
  if (e.type !== 'period') return ''
  return calcDuration(e.date, e.endDate, e.isOngoing === true)
})

const ageText = computed(() =>
  formatAgeAtDate(userStore.user?.birthDate, props.event.date, props.event.datePrecision),
)
</script>

<template>
  <!-- 里程碑:大卡 -->
  <article
    v-if="kind === 'milestone'"
    class="tl-card tl-card--milestone group"
    :style="{ '--cat': category.color }"
    tabindex="0"
    :data-measure-key="measureKey"
  >
    <span class="tl-milestone-bar" aria-hidden="true" />
    <div class="flex items-start justify-between gap-2">
      <h3 class="font-display text-lg font-semibold leading-snug text-app-ink">
        {{ event.title }}
      </h3>
      <div class="tl-actions">
        <button type="button" class="tl-action" :aria-label="`编辑 ${event.title}`" @click.stop="emit('edit', event)">
          <Pencil :size="14" />
        </button>
        <button type="button" class="tl-action tl-action--danger" :aria-label="`删除 ${event.title}`" @click.stop="emit('delete', event)">
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-app-ink-soft">
      <span class="inline-flex items-center gap-1 font-medium" :style="{ color: category.color }">
        <component :is="category.icon" :size="13" />
        {{ category.label }}
      </span>
      <span class="inline-flex items-center gap-1">
        <CalendarDays :size="13" />
        {{ dateText }}
      </span>
      <span v-if="ageText" class="text-app-ink-faint">{{ ageText }}</span>
      <span
        v-if="durationText"
        class="rounded-full px-2 py-0.5 text-[11px] font-medium"
        :style="{ backgroundColor: category.color + '1f', color: category.color }"
      >
        {{ event.isOngoing ? '至今' : durationText }}
      </span>
    </div>
    <p v-if="event.description" class="mt-2.5 text-sm leading-relaxed text-app-ink-soft line-clamp-3">
      {{ event.description }}
    </p>
  </article>

  <!-- 轻量单行 -->
  <div
    v-else-if="kind === 'minor'"
    class="tl-minor group"
    tabindex="0"
    :data-measure-key="measureKey"
  >
    <span class="h-1.5 w-1.5 flex-shrink-0 rounded-full" :style="{ backgroundColor: category.color }" />
    <span class="min-w-0 flex-1 truncate text-sm text-app-ink">{{ event.title }}</span>
    <span v-if="event.location" class="hidden items-center gap-0.5 text-xs text-app-ink-faint sm:inline-flex">
      <MapPin :size="11" />{{ event.location }}
    </span>
    <span class="flex-shrink-0 text-xs text-app-ink-faint">{{ dateText }}</span>
    <div class="tl-actions">
      <button type="button" class="tl-action" :aria-label="`编辑 ${event.title}`" @click.stop="emit('edit', event)">
        <Pencil :size="13" />
      </button>
      <button type="button" class="tl-action tl-action--danger" :aria-label="`删除 ${event.title}`" @click.stop="emit('delete', event)">
        <Trash2 :size="13" />
      </button>
    </div>
  </div>

  <!-- 标准卡 -->
  <div
    v-else
    class="tl-card group"
    :style="{ '--cat': category.color }"
    tabindex="0"
    :data-measure-key="measureKey"
  >
    <div class="flex items-start justify-between gap-2">
      <h3 class="font-display text-base font-semibold leading-snug text-app-ink">
        {{ event.title }}
      </h3>
      <div class="tl-actions">
        <button type="button" class="tl-action" :aria-label="`编辑 ${event.title}`" @click.stop="emit('edit', event)">
          <Pencil :size="14" />
        </button>
        <button type="button" class="tl-action tl-action--danger" :aria-label="`删除 ${event.title}`" @click.stop="emit('delete', event)">
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
    <div class="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-app-ink-soft">
      <span class="inline-flex items-center gap-1 font-medium" :style="{ color: category.color }">
        <component :is="category.icon" :size="13" />
        {{ category.label }}
      </span>
      <span>{{ dateText }}</span>
      <span v-if="ageText" class="text-app-ink-faint">{{ ageText }}</span>
      <span
        v-if="durationText"
        class="rounded-full px-2 py-0.5 text-[11px] font-medium"
        :style="{ backgroundColor: category.color + '1f', color: category.color }"
      >
        {{ event.isOngoing ? '至今' : durationText }}
      </span>
    </div>
    <p v-if="event.description" class="mt-2 text-sm leading-relaxed text-app-ink-soft line-clamp-2">
      {{ event.description }}
    </p>
  </div>
</template>

<style scoped>
.tl-card {
  position: relative;
  background-color: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 1rem;
  padding: 1rem 1.125rem;
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}
.tl-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
  border-color: var(--app-border-strong);
}

.tl-card--milestone {
  padding: 1.25rem 1.375rem;
  border-color: color-mix(in srgb, var(--cat) 35%, var(--app-border));
}

.tl-milestone-bar {
  position: absolute;
  left: -1px;
  top: 1rem;
  bottom: 1rem;
  width: 3px;
  border-radius: 999px;
  background: var(--cat);
}

.tl-minor {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.625rem;
  transition: background-color 0.15s ease;
}
.tl-minor:hover {
  background-color: var(--app-bg-deep);
}

/* 操作按钮:桌面悬停浮现,触屏常显 */
.tl-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.group:hover .tl-actions,
.tl-actions:focus-within {
  opacity: 1;
}
@media (hover: none) {
  .tl-actions {
    opacity: 1;
  }
}

.tl-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.625rem;
  height: 1.625rem;
  border-radius: 0.375rem;
  color: var(--app-ink-faint);
  transition: background-color 0.15s ease, color 0.15s ease;
}
.tl-action:hover {
  background-color: var(--app-bg-deep);
  color: var(--app-ink);
}
.tl-action--danger:hover {
  color: #d9564f;
}
</style>
