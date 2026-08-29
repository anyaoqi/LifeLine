<script setup lang="ts">
import { computed } from 'vue'
import { CATEGORIES, EVENT_TYPES } from '@/utils/constants'
import { useEventStore } from '@/stores/eventStore'

const eventStore = useEventStore()

const keyword = computed({
  get: () => eventStore.searchKeyword,
  set: (v: string) => eventStore.setKeyword(v),
})

function isCategoryActive(key: string): boolean {
  return eventStore.activeCategories.has(key as never)
}

function toggleCategory(key: string) {
  eventStore.toggleCategory(key as never)
}

function isTypeActive(key: string): boolean {
  return eventStore.activeTypes.has(key as never)
}

function toggleType(key: string) {
  eventStore.toggleType(key as never)
}

const onlyBigEvents = computed({
  get: () => eventStore.onlyBigEvents,
  set: (value: boolean) => eventStore.setOnlyBigEvents(value),
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6 animate-fade-in">
    <!-- 搜索框 -->
    <div class="relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
        🔍
      </span>
      <input
        v-model="keyword"
        type="text"
        class="input-base pl-9 pr-9"
        placeholder="搜索事件标题或描述…"
        aria-label="搜索事件"
      />
      <button
        v-if="keyword"
        type="button"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        title="清除搜索"
        aria-label="清除搜索"
        @click="keyword = ''"
      >
        ✕
      </button>
    </div>

    <!-- 快捷筛选：大事与事件形态 -->
    <div class="mt-3 flex flex-wrap items-center gap-2">
      <label
        class="inline-flex cursor-pointer items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-all"
        :class="onlyBigEvents
          ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/25 dark:text-primary-200'
          : 'border-gray-200 text-gray-600 dark:border-gray-600 dark:text-gray-300'"
      >
        <input v-model="onlyBigEvents" type="checkbox" class="rounded border-gray-300 text-primary-500 focus:ring-primary-400" />
        ★ 只看大事
      </label>
      <span class="text-xs text-gray-400">形态：</span>
      <button
        v-for="eventType in EVENT_TYPES"
        :key="eventType.key"
        type="button"
        :title="eventType.hint"
        :class="[
          'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
          isTypeActive(eventType.key)
            ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/25 dark:text-primary-200'
            : 'border-gray-200 text-gray-600 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
        ]"
        @click="toggleType(eventType.key)"
      >
        <span>{{ eventType.icon }}</span>{{ eventType.label }}
      </button>
    </div>

    <!-- 分类 chips -->
    <div class="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
      <span class="text-xs text-gray-400 flex-shrink-0">分类：</span>
      <button
        v-for="cat in CATEGORIES"
        :key="cat.key"
        type="button"
        :class="[
          'flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
          isCategoryActive(cat.key)
            ? 'text-white border-transparent shadow-sm'
            : 'text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700',
        ]"
        :style="isCategoryActive(cat.key) ? { backgroundColor: cat.color } : undefined"
        @click="toggleCategory(cat.key)"
      >
        <span>{{ cat.emoji }}</span>
        <span>{{ cat.label }}</span>
      </button>

      <!-- 清除筛选 -->
      <button
        v-if="eventStore.isFiltering"
        type="button"
        class="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
        @click="eventStore.clearFilters()"
      >
        ✕ 清除筛选
      </button>
    </div>

    <!-- 筛选结果计数 -->
    <p
      v-if="eventStore.isFiltering"
      class="mt-2 text-xs text-gray-400"
    >
      匹配 {{ eventStore.filteredCount }} / {{ eventStore.totalCount }} 个事件
    </p>
  </div>
</template>
