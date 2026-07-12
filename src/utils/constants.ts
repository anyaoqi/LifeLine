import type { EventCategory } from '@/types';

// ============ 事件分类定义 ============
// 与 设计理念与UI指南.md 中的分类色严格对齐
export interface CategoryDef {
  key: EventCategory;
  label: string;       // 中文标签
  color: string;       // 主色（用于节点、色块）
  emoji: string;       // 图标 emoji（避免引入额外图标库）
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'life',        label: '生活', color: '#D4A574', emoji: '🏠' },
  { key: 'education',   label: '学业', color: '#6B8DD6', emoji: '📚' },
  { key: 'work',        label: '工作', color: '#7BA362', emoji: '💼' },
  { key: 'travel',      label: '旅行', color: '#9B7BA3', emoji: '✈️' },
  { key: 'love',        label: '感情', color: '#E8878D', emoji: '❤️' },
  { key: 'health',      label: '健康', color: '#D68E6D', emoji: '💪' },
  { key: 'achievement', label: '成就', color: '#F0C674', emoji: '🏆' },
  { key: 'other',       label: '其他', color: '#A0A0A0', emoji: '✨' },
];

// 分类默认值（用户未选择时）
export const DEFAULT_CATEGORY: EventCategory = 'life';

// 分类映射，便于 O(1) 查找
export const CATEGORY_MAP: Record<EventCategory, CategoryDef> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.key] = c;
    return acc;
  },
  {} as Record<EventCategory, CategoryDef>
);

// 获取分类定义（带容错，未知分类回退到 other）
export function getCategory(key: EventCategory | string | undefined): CategoryDef {
  if (key && key in CATEGORY_MAP) {
    return CATEGORY_MAP[key as EventCategory];
  }
  return CATEGORY_MAP.other;
}

// ============ 主题选项 ============
export const THEME_LABELS = {
  light: '浅色',
  dark: '深色',
  auto: '跟随系统',
} as const;
