<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Check, Pencil, Search, Trash2 } from 'lucide-vue-next'
import EventFormPanel from '@/components/event/EventFormPanel.vue'
import EventDeleteConfirm from '@/components/EventForm/EventDeleteConfirm.vue'
import AppModal from '@/components/common/AppModal.vue'
import Chip from '@/components/ui/Chip.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useEventStore } from '@/stores/eventStore'
import { useToast } from '@/composables/useToast'
import { CATEGORIES } from '@/utils/constants'
import { formatChineseDate, calcDuration } from '@/utils/dateUtils'
import type { EventType, LifeEvent } from '@/types'

/**
 * 列表视图:表格化浏览与批量整理。
 * 与时间线共享 store 筛选;支持批量选择删除、行内进入编辑。
 */
const eventStore = useEventStore()
const toast = useToast()

onMounted(() => {
  void eventStore.loadEvents()
})

const keyword = ref(eventStore.searchKeyword)
// 输入即筛选(本地内存数据,无需防抖)
watch(keyword, value => eventStore.setKeyword(value))

const sortValue = ref<'asc' | 'desc'>('asc')
const sortOptions = [
  { value: 'asc', label: '最早在前' },
  { value: 'desc', label: '最近在前' },
]
const typeValue = ref('all')
const typeOptions = [
  { value: 'all', label: '全部' },
  { value: 'point', label: '● 时间点' },
  { value: 'period', label: '▮ 区间' },
]

const displayEvents = computed(() => {
  const base = eventStore.filteredSortedEvents
  return sortValue.value === 'asc' ? base : [...base].reverse()
})

const yearGroups = computed(() => {
  const groups: { year: number; events: LifeEvent[] }[] = []
  for (const e of displayEvents.value) {
    const year = new Date(e.date).getFullYear()
    const last = groups[groups.length - 1]
    if (!last || last.year !== year) groups.push({ year, events: [e] })
    else last.events.push(e)
  }
  return groups
})

// ============ 编辑 / 删除 ============
const editOpen = ref(false)
const editing = ref<LifeEvent | null>(null)
const deleteOpen = ref(false)
const deleting = ref<LifeEvent | null>(null)

function openEdit(e: LifeEvent) {
  editing.value = e
  editOpen.value = true
}

function askDelete(e: LifeEvent) {
  deleting.value = e
  deleteOpen.value = true
}

async function confirmDelete() {
  const target = deleting.value
  deleteOpen.value = false
  deleting.value = null
  if (!target) return
  selectedIds.value.delete(target.id)
  await eventStore.deleteEvent(target.id)
  toast.success(`已删除「${target.title}」`)
}

// ============ 批量选择 ============
const selectedIds = ref<Set<string>>(new Set())
function toggleSelect(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

// ============ 批量删除 ============
const batchOpen = ref(false)
const batchDeleting = ref(false)

async function confirmBatchDelete() {
  batchDeleting.value = true
  try {
    const ids = [...selectedIds.value]
    for (const id of ids) {
      await eventStore.deleteEvent(id)
    }
    eventStore.dismissRecentlyDeleted()
    selectedIds.value = new Set()
    batchOpen.value = false
    toast.success(`已删除 ${ids.length} 条记录`)
  } catch {
    toast.error('批量删除失败,请重试')
  } finally {
    batchDeleting.value = false
  }
}

// ============ 草稿确认 ============
async function confirmDraft(e: LifeEvent) {
  try {
    await eventStore.confirmDraft(e.id)
    toast.success(`「${e.title}」已确认`)
  } catch {
    toast.error('确认失败,请重试')
  }
}

const isEmpty = computed(() => eventStore.totalCount === 0)

function dateText(e: LifeEvent) {
  if (e.type === 'period') {
    const end = e.isOngoing ? '至今' : formatChineseDate(e.endDate, e.endDatePrecision)
    return `${formatChineseDate(e.date, e.datePrecision)} – ${end}`
  }
  return formatChineseDate(e.date, e.datePrecision)
}

function durationText(e: LifeEvent) {
  if (e.type !== 'period') return ''
  return calcDuration(e.date, e.endDate, e.isOngoing === true)
}
</script>

<template>
  <div class="mx-auto w-full max-w-5xl animate-fade-in px-4 py-8 sm:px-6">
    <!-- 页头 -->
    <header class="mb-6">
      <p class="text-[10px] font-medium tracking-[0.35em] text-app-accent">ORGANIZE</p>
      <h1 class="mt-1.5 font-display text-3xl font-bold text-app-ink">整理</h1>
      <p class="mt-1 text-sm text-app-ink-soft">
        {{ eventStore.totalCount }} 条记录 · 批量浏览与修改
      </p>
    </header>

    <EmptyState
      v-if="isEmpty"
      title="还没有可整理的记录"
      description="先去时间线记下第一件事,或用人生模板铺底。"
    >
      <template #action>
        <button
          type="button"
          class="inline-flex h-10 items-center rounded-lg bg-app-accent px-4 text-sm font-medium text-white shadow-sm transition-all hover:brightness-95"
          @click="$router.push('/')"
        >
          回到时间线
        </button>
      </template>
    </EmptyState>

    <template v-else>
      <!-- 工具行 -->
      <div class="mb-4 space-y-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative min-w-52 flex-1">
            <Search
              :size="15"
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-ink-faint"
            />
            <input
              v-model="keyword"
              type="text"
              placeholder="搜索…"
              class="h-9 w-full rounded-lg border border-app-border bg-app-surface pl-9 pr-3 text-sm text-app-ink placeholder:text-app-ink-faint focus:border-app-accent focus:outline-none focus:ring-2 focus:ring-app-accent/20"
            />
          </div>
          <SegmentedControl v-model="sortValue" :options="sortOptions" size="sm" />
          <SegmentedControl
            v-model="typeValue"
            :options="typeOptions"
            size="sm"
            @update:model-value="(v) => {
              const set = new Set<EventType>()
              if (v === 'point' || v === 'period') set.add(v as EventType)
              eventStore.activeTypes = set
            }"
          />
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <Chip
            v-for="cat in CATEGORIES"
            :key="cat.key"
            :selected="eventStore.activeCategories.has(cat.key)"
            :color="cat.color"
            @click="eventStore.toggleCategory(cat.key)"
          >
            {{ cat.label }}
          </Chip>
        </div>
      </div>

      <!-- 批量操作条 -->
      <div
        v-if="selectedIds.size > 0"
        class="sticky top-16 z-20 mb-3 flex items-center gap-3 rounded-xl border border-app-accent/40 bg-app-accent-soft px-4 py-2.5"
      >
        <span class="text-sm font-medium text-app-ink">已选 {{ selectedIds.size }} 条</span>
        <button
          type="button"
          class="text-sm text-app-ink-soft transition-colors hover:text-app-ink"
          @click="selectedIds = new Set()"
        >
          取消选择
        </button>
        <button
          type="button"
          class="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600/90 px-3 text-sm font-medium text-white transition-colors hover:bg-red-600"
          @click="batchOpen = true"
        >
          <Trash2 :size="14" /> 删除所选
        </button>
      </div>

      <!-- 无匹配 -->
      <EmptyState
        v-else-if="displayEvents.length === 0"
        title="没有匹配的记录"
        description="试试调整关键词或筛选条件。"
      >
        <template #action>
          <button
            type="button"
            class="inline-flex h-9 items-center rounded-lg border border-app-border-strong px-4 text-sm text-app-ink transition-colors hover:bg-app-bg-deep"
            @click="keyword = ''; eventStore.clearFilters()"
          >
            清除筛选
          </button>
        </template>
      </EmptyState>

      <!-- 列表:按年份分组 -->
      <div v-else class="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
        <template v-for="group in yearGroups" :key="group.year">
          <!-- 年份分组头 -->
          <div
            class="flex items-center gap-3 border-b border-app-border bg-app-bg-deep/60 px-4 py-2"
          >
            <button
              type="button"
              class="flex h-4 w-4 items-center justify-center rounded border transition-colors"
              :class="group.events.every(e => selectedIds.has(e.id))
                ? 'border-app-accent bg-app-accent text-white'
                : 'border-app-border-strong'"
              :aria-label="`全选 ${group.year} 年`"
              @click="() => {
                const all = group.events.every(e => selectedIds.has(e.id));
                const next = new Set(selectedIds);
                group.events.forEach(e => all ? next.delete(e.id) : next.add(e.id));
                selectedIds = next;
              }"
            >
              <Check v-if="group.events.every(e => selectedIds.has(e.id))" :size="11" :stroke-width="3" />
            </button>
            <span class="font-display text-sm font-bold text-app-ink">{{ group.year }}</span>
            <span class="text-xs text-app-ink-faint">{{ group.events.length }} 条</span>
          </div>

          <!-- 行 -->
          <div
            v-for="e in group.events"
            :key="e.id"
            class="list-row group"
            :class="{ 'list-row--draft': e.isDraft }"
          >
            <button
              type="button"
              class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors"
              :class="selectedIds.has(e.id)
                ? 'border-app-accent bg-app-accent text-white'
                : 'border-app-border-strong'"
              :aria-label="`选择 ${e.title}`"
              @click="toggleSelect(e.id)"
            >
              <Check v-if="selectedIds.has(e.id)" :size="11" :stroke-width="3" />
            </button>

            <!-- 日期 -->
            <span class="w-44 flex-shrink-0 text-xs text-app-ink-soft">{{ dateText(e) }}</span>

            <!-- 标题 -->
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-2 text-left"
              @click="openEdit(e)"
            >
              <span
                class="h-2 w-2 flex-shrink-0 rounded-full"
                :style="{ backgroundColor: CATEGORIES.find(c => c.key === e.category)?.color }"
              />
              <span class="truncate text-sm font-medium text-app-ink group-hover:text-app-accent">
                {{ e.title }}
              </span>
              <span
                v-if="e.isDraft"
                class="flex-shrink-0 rounded-full border border-dashed border-app-accent/60 px-1.5 text-[10px] text-app-accent"
              >草稿</span>
              <span v-if="durationText(e)" class="flex-shrink-0 text-xs text-app-ink-faint">
                {{ e.isOngoing ? '至今' : durationText(e) }}
              </span>
            </button>

            <!-- 操作 -->
            <div class="flex flex-shrink-0 items-center gap-0.5">
              <button
                v-if="e.isDraft"
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-md text-app-ink-faint transition-colors hover:bg-app-bg-deep hover:text-app-accent"
                :aria-label="`确认 ${e.title}`"
                title="确认这条记录"
                @click="confirmDraft(e)"
              >
                <Check :size="14" />
              </button>
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-md text-app-ink-faint transition-colors hover:bg-app-bg-deep hover:text-app-ink"
                :aria-label="`编辑 ${e.title}`"
                @click="openEdit(e)"
              >
                <Pencil :size="14" />
              </button>
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-md text-app-ink-faint transition-colors hover:bg-app-bg-deep hover:text-red-500"
                :aria-label="`删除 ${e.title}`"
                @click="askDelete(e)"
              >
                <Trash2 :size="14" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- 编辑弹窗 -->
    <AppModal v-model="editOpen" title="编辑事件" max-width="max-w-lg" @close="editOpen = false; editing = null">
      <EventFormPanel
        :existing="editing"
        @saved="() => { editOpen = false; editing = null }"
        @cancel="() => { editOpen = false; editing = null }"
      />
    </AppModal>

    <!-- 单条删除确认 -->
    <AppModal v-model="deleteOpen" title="删除事件" max-width="max-w-md">
      <EventDeleteConfirm
        v-if="deleting"
        :title="deleting.title"
        @confirm="confirmDelete"
        @cancel="deleteOpen = false"
      />
    </AppModal>

    <!-- 批量删除确认 -->
    <AppModal v-model="batchOpen" title="批量删除" max-width="max-w-md">
      <div class="text-center">
        <p class="text-sm leading-relaxed text-app-ink">
          确定删除选中的 <span class="font-semibold text-red-500">{{ selectedIds.size }}</span> 条记录吗?
        </p>
        <p class="mt-1.5 text-xs text-app-ink-faint">此操作不可撤销,建议先导出备份。</p>
        <div class="mt-6 flex justify-center gap-3">
          <button
            type="button"
            class="inline-flex h-9 items-center rounded-lg border border-app-border-strong px-4 text-sm text-app-ink transition-colors hover:bg-app-bg-deep"
            @click="batchOpen = false"
          >
            取消
          </button>
          <button
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600/90 px-4 text-sm font-medium text-white transition-colors hover:bg-red-600"
            :disabled="batchDeleting"
            @click="confirmBatchDelete"
          >
            <Trash2 :size="14" />
            {{ batchDeleting ? '删除中…' : '确认删除' }}
          </button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<style scoped>
.list-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--app-border);
  transition: background-color 0.15s ease;
}
.list-row:last-child {
  border-bottom: none;
}
.list-row:hover {
  background-color: var(--app-bg-deep);
}
.list-row--draft {
  background-color: color-mix(in srgb, var(--app-accent) 4%, transparent);
}
@media (max-width: 640px) {
  .list-row {
    gap: 0.625rem;
    padding: 0.5rem 0.75rem;
  }
  .list-row > span.w-44 {
    width: auto;
    flex-shrink: 1;
    min-width: 0;
  }
}
</style>
