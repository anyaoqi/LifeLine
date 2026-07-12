import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { LifeEvent, LifeEventInput, EventCategory } from '@/types';
import { eventService } from '@/services/storageService';
import { applyFilter, hasActiveFilter } from '@/utils/filter';
import { useUserStore } from './userStore';

export const useEventStore = defineStore('event', () => {
  const events = ref<LifeEvent[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ============ 筛选状态（仅作用于时间线展示） ============
  const searchKeyword = ref('');
  const activeCategories = ref<Set<EventCategory>>(new Set());

  const userStore = useUserStore();

  // 按日期升序（从早到晚）排列的事件
  const sortedEvents = computed(() =>
    [...events.value].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  );

  // 按日期降序（最近优先）排列的事件
  const recentEvents = computed(() =>
    [...events.value].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  );

  // 按年份分组（用于时间线展示）
  const eventsByYear = computed(() => {
    const groups: Record<number, LifeEvent[]> = {};
    for (const ev of sortedEvents.value) {
      const year = new Date(ev.date).getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(ev);
    }
    return groups;
  });

  // 统计：总事件数
  const totalCount = computed(() => events.value.length);

  // 统计：最早/最新事件
  const earliestEvent = computed(() => sortedEvents.value[0] ?? null);
  const latestEvent = computed(() => recentEvents.value[0] ?? null);

  // ============ 筛选后的视图 ============
  // 当前筛选条件对象
  const filterCriteria = computed(() => ({
    keyword: searchKeyword.value,
    categories: activeCategories.value,
  }));

  // 是否有生效的筛选条件
  const isFiltering = computed(() => hasActiveFilter(filterCriteria.value));

  // 应用筛选后、按日期升序排列的事件（时间线使用）
  const filteredSortedEvents = computed(() =>
    applyFilter(sortedEvents.value, filterCriteria.value)
  );

  // 筛选后的事件数（用于「无匹配结果」提示）
  const filteredCount = computed(() => filteredSortedEvents.value.length);

  // ============ 筛选操作 ============
  function setKeyword(keyword: string) {
    searchKeyword.value = keyword;
  }

  function toggleCategory(category: EventCategory) {
    const next = new Set(activeCategories.value);
    if (next.has(category)) {
      next.delete(category);
    } else {
      next.add(category);
    }
    // 用新 Set 替换以触发响应式
    activeCategories.value = next;
  }

  function clearFilters() {
    searchKeyword.value = '';
    activeCategories.value = new Set();
  }

  // 加载当前用户的所有事件
  async function loadEvents() {
    if (!userStore.userId) {
      events.value = [];
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      events.value = await eventService.getEventsByUserSorted(userStore.userId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载事件失败';
    } finally {
      loading.value = false;
    }
  }

  // 创建事件
  async function createEvent(input: LifeEventInput): Promise<LifeEvent> {
    if (!userStore.userId) throw new Error('未找到用户');
    loading.value = true;
    error.value = null;
    try {
      const now = new Date().toISOString();
      const newEvent: LifeEvent = {
        ...input,
        id: eventService.generateId(),
        userId: userStore.userId,
        createdAt: now,
        updatedAt: now,
      };
      await eventService.addEvent(newEvent);
      events.value.push(newEvent);
      return newEvent;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建事件失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 更新事件
  async function updateEvent(
    id: string,
    input: Partial<LifeEventInput>
  ): Promise<LifeEvent | undefined> {
    loading.value = true;
    error.value = null;
    try {
      const index = events.value.findIndex(e => e.id === id);
      if (index === -1) return undefined;
      const updated: LifeEvent = {
        ...events.value[index],
        ...input,
        updatedAt: new Date().toISOString(),
      } as LifeEvent;
      await eventService.updateEvent(updated);
      events.value[index] = updated;
      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新事件失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 删除事件
  async function deleteEvent(id: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await eventService.deleteEvent(id);
      events.value = events.value.filter(e => e.id !== id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除事件失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 清空（用户切换时）
  function reset() {
    events.value = [];
    error.value = null;
    loading.value = false;
  }

  return {
    // State
    events,
    loading,
    error,
    searchKeyword,
    activeCategories,
    // Computed - 全量
    sortedEvents,
    recentEvents,
    eventsByYear,
    totalCount,
    earliestEvent,
    latestEvent,
    // Computed - 筛选后
    isFiltering,
    filteredSortedEvents,
    filteredCount,
    // Methods
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    setKeyword,
    toggleCategory,
    clearFilters,
    reset,
  };
});
