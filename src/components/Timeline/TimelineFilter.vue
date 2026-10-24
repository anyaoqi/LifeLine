<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search, X } from 'lucide-vue-next'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import Chip from '@/components/ui/Chip.vue'
import { CATEGORIES } from '@/utils/constants'
import { useEventStore } from '@/stores/eventStore'
import { useUiStore } from '@/stores/uiStore'
import type { EventType } from '@/types'

/** 时间线筛选:搜索(可被 / 快捷键聚焦)+ 分类 + 形态 + 密度(纪念册/只看大事) */
const eventStore = useEventStore()
const uiStore = useUiStore()

const searchRef = ref<HTMLInputElement | null>(null)
const keyword = ref(eventStore.searchKeyword)

watch(keyword, value => eventStore.setKeyword(value))

// 头部搜索按钮 / 「/」快捷键 → 聚焦本输入框
watch(
  () => uiStore.searchFocusSeq,
  () => {
    searchRef.value?.focus()
    searchRef.value?.select()
  },
)

const typeValue = ref('all')
const typeOptions = [
  { value: 'all', label: '全部' },
  { value: 'point', label: '● 时间点' },
  { value: 'period', label: '▮ 区间' },
]

function onTypeChange(value: string | number) {
  const set = new Set<EventType>()
  if (value === 'point' || value === 'period') set.add(value as EventType)
  eventStore.activeTypes = set
}

function clearAll() {
  keyword.value = ''
  typeValue.value = 'all'
  eventStore.clearFilters()
}

defineExpose({
  focus: () => searchRef.value?.focus(),
})
</script>

<template>
  <div>
    <!-- 搜索行 -->
    <div class="relative">
      <Search
        :size="15"
        class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-app-ink-faint"
      />
      <input
        ref="searchRef"
        id="timeline-search"
        v-model="keyword"
        type="text"
        placeholder="搜索人生记录…(快捷键 /)"
        class="tl-search"
      />
      <button
        v-if="keyword"
        type="button"
        class="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-app-ink-faint transition-colors hover:bg-app-bg-deep hover:text-app-ink"
        aria-label="清空搜索"
        @click="keyword = ''"
      >
        <X :size="13" />
      </button>
    </div>

    <!-- 筛选行 -->
    <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
      <Chip
        v-for="cat in CATEGORIES"
        :key="cat.key"
        :selected="eventStore.activeCategories.has(cat.key)"
        :color="cat.color"
        @click="eventStore.toggleCategory(cat.key)"
      >
        {{ cat.label }}
      </Chip>

      <span class="mx-1 hidden h-4 w-px bg-app-border sm:block" />

      <div class="ml-auto flex items-center gap-1.5">
        <SegmentedControl
          v-model="typeValue"
          :options="typeOptions"
          size="sm"
          @update:model-value="onTypeChange"
        />

        <!-- 密度:纪念册 / 只看大事 -->
        <button
          type="button"
          :class="[
            'inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all',
            eventStore.onlyBigEvents
              ? 'border-app-accent bg-app-accent-soft text-app-accent'
              : 'border-app-border bg-app-surface text-app-ink-soft hover:border-app-border-strong',
          ]"
          :title="eventStore.onlyBigEvents ? '当前只展示大事,点击恢复完整纪念册' : '只看大事与里程碑'"
          :aria-pressed="eventStore.onlyBigEvents"
          @click="eventStore.setOnlyBigEvents(!eventStore.onlyBigEvents)"
        >
          {{ eventStore.onlyBigEvents ? '只看大事' : '纪念册' }}
        </button>

        <button
          v-if="eventStore.isFiltering"
          type="button"
          class="inline-flex h-7 items-center gap-1 rounded-full px-2 text-xs text-app-ink-faint transition-colors hover:text-app-ink"
          @click="clearAll"
        >
          <X :size="12" /> 清除
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tl-search {
  width: 100%;
  height: 2.5rem;
  padding: 0 2.5rem;
  border-radius: 0.75rem;
  border: 1px solid var(--app-border);
  background-color: var(--app-surface);
  color: var(--app-ink);
  font-size: 0.875rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.tl-search::placeholder {
  color: var(--app-ink-faint);
}
.tl-search:focus {
  outline: none;
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}
</style>
