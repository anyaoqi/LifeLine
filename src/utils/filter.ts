import type { LifeEvent, EventCategory, EventType, Importance } from '@/types'

export interface FilterCriteria {
  /** 搜索关键词（匹配标题与描述，不区分大小写） */
  keyword: string
  /** 选中的分类集合；空集合表示不限分类 */
  categories: Set<EventCategory>
  /** 最低重要程度；undefined 表示不限。用于「只看大事」（>= 4） */
  minimumImportance?: Importance
  /** 选中的时间形态；空/undefined 表示不限 */
  types?: Set<EventType>
}

/**
 * 判断单个事件是否符合筛选条件
 */
export function matchesFilter(event: LifeEvent, criteria: FilterCriteria): boolean {
  // 分类筛选：集合非空时必须命中
  if (criteria.categories.size > 0 && !criteria.categories.has(event.category)) {
    return false
  }

  // 重要程度筛选：旧数据经 normalize 后为 3，此处仍做容错。
  if (criteria.minimumImportance !== undefined && (event.importance ?? 3) < criteria.minimumImportance) {
    return false
  }

  // 形态筛选：点事件 / 区间事件可独立查看。
  if (criteria.types && criteria.types.size > 0 && !criteria.types.has(event.type)) {
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
  return criteria.keyword.trim() !== ''
    || criteria.categories.size > 0
    || criteria.minimumImportance !== undefined
    || (criteria.types?.size ?? 0) > 0
}

/**
 * 对事件数组应用筛选
 */
export function applyFilter(events: LifeEvent[], criteria: FilterCriteria): LifeEvent[] {
  if (!hasActiveFilter(criteria)) return events
  return events.filter(e => matchesFilter(e, criteria))
}
