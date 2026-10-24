<script setup lang="ts">
import { computed } from 'vue'
import { Check, MapPin, Pencil, Trash2 } from 'lucide-vue-next'
import { getCategory } from '@/utils/constants'
import { formatDateRange, calcDuration, formatAgeAtDate } from '@/utils/dateUtils'
import { useUserStore } from '@/stores/userStore'
import type { LifeEvent } from '@/types'

/**
 * 时间线卡片,按重要程度三档呈现:
 *  - milestone(≥5) 里程碑:衬线大标题 + 分类印章 + 纸质折角
 *  - standard(3-4) 标准卡
 *  - minor(1-2)   轻量单行
 * 高度参与虚拟滚动布局,根元素务必带 data-measure-key。
 */
const props = defineProps<{ event: LifeEvent; measureKey?: string }>()
const emit = defineEmits<{
  edit: [event: LifeEvent]
  delete: [event: LifeEvent]
  confirm: [event: LifeEvent]
  open: [event: LifeEvent]
}>()

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
    :class="{ 'tl-card--draft': event.isDraft }"
    :style="{ '--cat': category.color }"
    tabindex="0"
    :data-measure-key="measureKey"
    @click="emit('open', event)"
  >
    <span class="tl-fold" aria-hidden="true" />
    <div class="flex items-start gap-3">
      <span class="tl-seal tl-seal--lg" aria-hidden="true">
        <component :is="category.icon" :size="17" :stroke-width="1.9" />
      </span>
      <div class="min-w-0 flex-1">
        <h3 class="tl-title tl-title--lg">
          {{ event.title }}
          <span v-if="event.isDraft" class="tl-draft-pill">草稿</span>
        </h3>
        <div class="tl-meta">
          <span class="tl-meta-date">{{ dateText }}</span>
          <template v-if="ageText">
            <i class="tl-dot-sep" />
            <span>{{ ageText }}</span>
          </template>
          <span v-if="durationText" class="tl-duration">{{ event.isOngoing ? '至今' : durationText }}</span>
        </div>
      </div>
      <div class="tl-actions">
        <button v-if="event.isDraft" type="button" class="tl-action tl-action--confirm" :aria-label="`确认 ${event.title}`" title="确认这条记录" @click.stop="emit('confirm', event)">
          <Check :size="14" />
        </button>
        <button type="button" class="tl-action" :aria-label="`编辑 ${event.title}`" @click.stop="emit('edit', event)">
          <Pencil :size="14" />
        </button>
        <button type="button" class="tl-action tl-action--danger" :aria-label="`删除 ${event.title}`" @click.stop="emit('delete', event)">
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
    <p v-if="event.description" class="tl-desc tl-desc--lg">{{ event.description }}</p>
    <span v-if="event.location" class="tl-location">
      <MapPin :size="12" />{{ event.location }}
    </span>
  </article>

  <!-- 轻量单行 -->
  <div
    v-else-if="kind === 'minor'"
    class="tl-minor group"
    :class="{ 'tl-minor--draft': event.isDraft }"
    tabindex="0"
    :data-measure-key="measureKey"
    @click="emit('open', event)"
  >
    <span class="tl-minor-dot" :style="{ backgroundColor: category.color }" />
    <span class="min-w-0 flex-1 truncate text-sm text-app-ink">
      {{ event.title }}
      <span v-if="event.isDraft" class="tl-draft-pill">草稿</span>
    </span>
    <span v-if="event.location" class="hidden items-center gap-0.5 text-xs text-app-ink-soft sm:inline-flex">
      <MapPin :size="11" />{{ event.location }}
    </span>
    <span class="flex-shrink-0 text-xs text-app-ink-soft">{{ dateText }}</span>
    <div class="tl-actions">
      <button v-if="event.isDraft" type="button" class="tl-action tl-action--confirm" :aria-label="`确认 ${event.title}`" title="确认这条记录" @click.stop="emit('confirm', event)">
        <Check :size="13" />
      </button>
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
    :class="{ 'tl-card--draft': event.isDraft }"
    :style="{ '--cat': category.color }"
    tabindex="0"
    :data-measure-key="measureKey"
    @click="emit('open', event)"
  >
    <div class="flex items-start gap-2.5">
      <span class="tl-seal" aria-hidden="true">
        <component :is="category.icon" :size="14" :stroke-width="1.9" />
      </span>
      <div class="min-w-0 flex-1">
        <h3 class="tl-title">
          {{ event.title }}
          <span v-if="event.isDraft" class="tl-draft-pill">草稿</span>
        </h3>
        <div class="tl-meta">
          <span class="tl-meta-date">{{ dateText }}</span>
          <template v-if="ageText">
            <i class="tl-dot-sep" />
            <span>{{ ageText }}</span>
          </template>
          <span v-if="durationText" class="tl-duration">{{ event.isOngoing ? '至今' : durationText }}</span>
        </div>
      </div>
      <div class="tl-actions">
        <button v-if="event.isDraft" type="button" class="tl-action tl-action--confirm" :aria-label="`确认 ${event.title}`" title="确认这条记录" @click.stop="emit('confirm', event)">
          <Check :size="14" />
        </button>
        <button type="button" class="tl-action" :aria-label="`编辑 ${event.title}`" @click.stop="emit('edit', event)">
          <Pencil :size="14" />
        </button>
        <button type="button" class="tl-action tl-action--danger" :aria-label="`删除 ${event.title}`" @click.stop="emit('delete', event)">
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
    <p v-if="event.description" class="tl-desc">{{ event.description }}</p>
  </div>
</template>

<style scoped>
/* ============ 卡片基底:纸面 ============ */
.tl-card {
  position: relative;
  background-color: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 1rem;
  padding: 0.875rem 1rem;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.2s ease,
    box-shadow 0.25s ease;
}
.tl-card:hover {
  transform: translateY(-2px);
  border-color: var(--app-border-strong);
  box-shadow:
    0 2px 4px rgb(42 38 34 / 0.05),
    0 12px 28px rgb(42 38 34 / 0.1);
}
.tl-card:active {
  transform: translateY(0) scale(0.995);
}

/* 里程碑:暖色纸面 + 折角 */
.tl-card--milestone {
  padding: 1.125rem 1.25rem;
  border-color: color-mix(in srgb, var(--cat) 26%, var(--app-border));
  background:
    linear-gradient(150deg, color-mix(in srgb, var(--cat) 7%, transparent), transparent 42%),
    var(--app-surface);
}
.tl-card--milestone:hover {
  border-color: color-mix(in srgb, var(--cat) 45%, var(--app-border));
  box-shadow:
    0 2px 4px rgb(42 38 34 / 0.05),
    0 16px 36px color-mix(in srgb, var(--cat) 18%, rgb(42 38 34 / 0.08));
}

/* 纸质折角:右上角一枚与页面同色的裁角 + 折影 */
.tl-fold {
  position: absolute;
  top: -1px;
  right: -1px;
  width: 0;
  height: 0;
  border-top: 15px solid var(--app-bg);
  border-left: 15px solid transparent;
  border-top-right-radius: 1rem;
  filter: drop-shadow(-1.5px 1.5px 1px rgb(42 38 34 / 0.1));
}

/* ============ 分类印章 ============ */
.tl-seal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  border-radius: 0.625rem;
  background: color-mix(in srgb, var(--cat) 14%, transparent);
  color: var(--cat);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.tl-seal--lg {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.75rem;
}
.group:hover .tl-seal {
  transform: scale(1.08) rotate(-4deg);
}

/* ============ 标题与元信息 ============ */
.tl-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--app-ink);
}
.tl-title--lg {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.tl-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem 0.5rem;
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: var(--app-ink-soft);
}
.tl-meta-date {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.02em;
}
.tl-dot-sep {
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: var(--app-border-strong);
}

.tl-duration {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.05rem 0.5rem;
  font-size: 11px;
  font-weight: 500;
  background: color-mix(in srgb, var(--cat) 13%, transparent);
  color: var(--app-ink-soft);
}

.tl-desc {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--app-ink-soft);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.tl-desc--lg {
  margin-top: 0.625rem;
  font-size: 0.9375rem;
  -webkit-line-clamp: 3;
}

.tl-location {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.625rem;
  font-size: 11px;
  color: var(--app-ink-soft);
}

/* 草稿 */
.tl-card--draft {
  border-style: dashed;
}
.tl-minor--draft {
  border: 1px dashed var(--app-border-strong);
}
.tl-draft-pill {
  display: inline-flex;
  align-items: center;
  margin-left: 0.375rem;
  padding: 0.05rem 0.45rem;
  vertical-align: middle;
  border-radius: 999px;
  border: 1px dashed color-mix(in srgb, var(--app-accent) 60%, transparent);
  font-family: var(--font-sans);
  font-size: 10px;
  font-weight: 500;
  color: var(--app-accent);
}

/* ============ 轻量单行 ============ */
.tl-minor {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.4375rem 0.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.tl-minor:hover {
  background-color: var(--app-bg-deep);
  transform: translateX(3px);
}
.tl-minor-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 999px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.tl-minor:hover .tl-minor-dot {
  transform: scale(1.6);
}

/* ============ 操作按钮 ============ */
.tl-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
  opacity: 0;
  transform: translateX(4px);
  transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}
.group:hover .tl-actions,
.group:focus-within .tl-actions,
.tl-card:focus .tl-actions,
.tl-minor:focus .tl-actions {
  opacity: 1;
  transform: translateX(0);
}
@media (hover: none) {
  .tl-actions {
    opacity: 1;
    transform: none;
  }
}

.tl-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.625rem;
  height: 1.625rem;
  border-radius: 0.4375rem;
  color: var(--app-ink-faint);
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}
.tl-action:hover {
  background-color: var(--app-bg-deep);
  color: var(--app-ink);
  transform: scale(1.08);
}
.tl-action--danger:hover {
  color: #d9564f;
}
.tl-action--confirm:hover {
  color: var(--app-accent);
}
</style>
