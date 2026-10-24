import type { EventCategory, DatePrecision, Importance, EventType } from '@/types';
import {
  BookOpen,
  Briefcase,
  Heart,
  HeartPulse,
  Home,
  Mountain,
  Plane,
  Trophy,
} from 'lucide-vue-next';
import type { Component } from 'vue';

// ============ 事件分类定义 ============
// 色板与 设计理念与UI指南.md 对齐(v0.6.0 降饱和调整)
export interface CategoryDef {
  key: EventCategory;
  label: string;       // 中文标签
  color: string;       // 主色(用于节点、色块)
  emoji: string;       // emoji(导出图片等纯文本场景)
  icon: Component;     // lucide 图标(界面使用)
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'life',        label: '生活', color: '#C9A26B', emoji: '🏠', icon: Home },
  { key: 'education',   label: '学业', color: '#7A93C9', emoji: '📚', icon: BookOpen },
  { key: 'work',        label: '工作', color: '#85A06B', emoji: '💼', icon: Briefcase },
  { key: 'travel',      label: '旅行', color: '#A388B5', emoji: '✈️', icon: Plane },
  { key: 'love',        label: '感情', color: '#D99096', emoji: '❤️', icon: Heart },
  { key: 'health',      label: '健康', color: '#C98A6B', emoji: '💚', icon: HeartPulse },
  { key: 'achievement', label: '成就', color: '#D9B96B', emoji: '🏆', icon: Trophy },
  { key: 'other',       label: '其他', color: '#9A948A', emoji: '✨', icon: Mountain },
];

// 分类默认值(用户未选择时)
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
} as const;

// ============ 事件形态（时间点 / 时间区间） ============
export interface EventTypeDef {
  key: EventType;
  label: string;
  icon: string;        // ● 时间点 / ▮ 时间区间，用于卡片与分段器
  hint: string;        // 表单里的一句话说明
}

export const EVENT_TYPES: EventTypeDef[] = [
  { key: 'point', label: '时间点', icon: '●', hint: '发生在某一天 / 某月 / 某年，如「结婚」「第一次出国」' },
  { key: 'period', label: '时间区间', icon: '▮', hint: '有起止的一段经历，如「上高中」「在某公司工作」' },
];

export const EVENT_TYPE_MAP: Record<EventType, EventTypeDef> = EVENT_TYPES.reduce(
  (acc, t) => {
    acc[t.key] = t;
    return acc;
  },
  {} as Record<EventType, EventTypeDef>
);

// ============ 日期精度 ============
export interface DatePrecisionDef {
  key: DatePrecision;
  label: string;       // 分段器上的短标签
  hint: string;        // 说明：记不清时选更粗的精度
}

export const DATE_PRECISIONS: DatePrecisionDef[] = [
  { key: 'day', label: '具体到日', hint: '如 2019年6月8日' },
  { key: 'month', label: '只记得月', hint: '如 2019年6月' },
  { key: 'year', label: '只记得年', hint: '如 2019年' },
];

export const DEFAULT_DATE_PRECISION: DatePrecision = 'day';

// ============ 重要程度 ============
export interface ImportanceDef {
  level: Importance;
  label: string;
  desc: string;
}

export const IMPORTANCE_LEVELS: ImportanceDef[] = [
  { level: 1, label: '小事', desc: '日常闪光点，如一次聚餐' },
  { level: 2, label: '值得记', desc: '想留个记录，如看了场演唱会' },
  { level: 3, label: '重要', desc: '比较难忘，如第一次出国' },
  { level: 4, label: '大事', desc: '人生阶段性事件，如参加工作' },
  { level: 5, label: '里程碑', desc: '改变人生轨迹，如结婚、生子' },
];

export const IMPORTANCE_MAP: Record<Importance, ImportanceDef> = IMPORTANCE_LEVELS.reduce(
  (acc, i) => {
    acc[i.level] = i;
    return acc;
  },
  {} as Record<Importance, ImportanceDef>
);

/** 默认重要程度（新建事件 + 旧数据迁移兜底） */
export const DEFAULT_IMPORTANCE: Importance = 3;

/** 「只看大事」的阈值：重要程度 >= 4 视为大事 */
export const BIG_EVENT_THRESHOLD: Importance = 4;

export function getImportance(level: Importance | number | undefined): ImportanceDef {
  const l = Number(level) as Importance;
  return IMPORTANCE_MAP[l] ?? IMPORTANCE_MAP[DEFAULT_IMPORTANCE];
}

/** 时间轴节点直径（px），随重要程度分层 */
export const NODE_SIZE_BY_IMPORTANCE: Record<Importance, number> = {
  1: 8,
  2: 9,
  3: 10,
  4: 12,
  5: 16,
};

/** 区间色带最小渲染长度（px）：保证几天的短区间也看得见 */
export const MIN_BAND_HEIGHT = 24;

/** 删除事件的撤销窗口（毫秒）：误删后这段时间内可一键恢复 */
export const UNDO_DELETE_WINDOW_MS = 30_000;
