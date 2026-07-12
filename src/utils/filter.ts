import type { LifeEvent, EventCategory } from '@/types'

export interface FilterCriteria {
  /** 搜索关键词（匹配标题与描述，不区分大小写） */
  keyword: string
  /** 选中的分类集合；空集合表示不限分类 */
  categories: Set<EventCategory>
}

/**
 * 判断单个事件是否符合筛选条件
 */
export function matchesFilter(event: LifeEvent, criteria: FilterCriteria): boolean {
  // 分类筛选：集合非空时必须命中
  if (criteria.categories.size > 0 && !criteria.categories.has(event.category)) {
    return false
  }

  // 关键词筛选：空关键词直接通过
  const keyword = criteria.keyword.trim().toLowerCase()
  if (!keyword) return true

  const inTitle = event.title.toLowerCase().includes(keyword)
  const inDesc = event.description?.toLowerCase().includes(keyword) ?? false
  return inTitle || inDesc
}

/**
 * 是否存在任何生效的筛选条件（用于判断是否显示「清除筛选」按钮等）
 */
export function hasActiveFilter(criteria: FilterCriteria): boolean {
  return criteria.keyword.trim() !== '' || criteria.categories.size > 0
}

/**
 * 对事件数组应用筛选
 */
export function applyFilter(events: LifeEvent[], criteria: FilterCriteria): LifeEvent[] {
  if (!hasActiveFilter(criteria)) return events
  return events.filter(e => matchesFilter(e, criteria))
}
