// ============ 统计工具函数（Phase 3） ============
// 纯函数：输入事件列表（+ 可选用户档案），输出各种聚合统计。
// 刻意保持无副作用、不依赖 Vue 响应式，便于后续单元测试。

import type { LifeEvent, EventCategory } from '@/types';
import { CATEGORIES, getCategory } from './constants';

// ============ 年度统计 ============
export interface YearStat {
  year: number;
  count: number;
}

/**
 * 按年份聚合事件数，结果按年份升序排列。
 * period 类型事件按起始日期归年。
 */
export function getYearlyStats(events: LifeEvent[]): YearStat[] {
  const map = new Map<number, number>();
  for (const ev of events) {
    const year = new Date(ev.date).getFullYear();
    if (isNaN(year)) continue;
    map.set(year, (map.get(year) ?? 0) + 1);
  }
  // 补全首末之间的空年份（count=0），让柱状图连续
  const years = [...map.keys()].sort((a, b) => a - b);
  if (years.length === 0) return [];
  const result: YearStat[] = [];
  for (let y = years[0]; y <= years[years.length - 1]; y++) {
    result.push({ year: y, count: map.get(y) ?? 0 });
  }
  return result;
}

// ============ 分类分布 ============
export interface CategoryStat {
  key: EventCategory;
  label: string;
  emoji: string;
  color: string;
  count: number;
  percentage: number; // 0-100，保留 1 位小数
}

/**
 * 按分类聚合事件，返回带百分比、配色、emoji 的分布数据。
 * 仅返回 count > 0 的分类，按 count 降序排列。
 */
export function getCategoryStats(events: LifeEvent[]): CategoryStat[] {
  const total = events.length;
  const counts = new Map<EventCategory, number>();
  for (const ev of events) {
    const c = ev.category;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }

  const result: CategoryStat[] = CATEGORIES.map((def) => {
    const count = counts.get(def.key) ?? 0;
    return {
      key: def.key,
      label: def.label,
      emoji: def.emoji,
      color: def.color,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    };
  });

  // 仅保留有数据的分类，按数量降序
  return result
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
}

// ============ 类型分布 ============
export interface TypeStat {
  point: number;
  period: number;
  total: number;
  pointPercentage: number;
  periodPercentage: number;
}

/**
 * 时间点 vs 时间区间分布
 */
export function getTypeStats(events: LifeEvent[]): TypeStat {
  let point = 0;
  let period = 0;
  for (const ev of events) {
    if (ev.type === 'period') period++;
    else point++;
  }
  const total = point + period;
  return {
    point,
    period,
    total,
    pointPercentage: total > 0 ? Math.round((point / total) * 1000) / 10 : 0,
    periodPercentage: total > 0 ? Math.round((period / total) * 1000) / 10 : 0,
  };
}

// ============ 月份分布 ============
export interface MonthStat {
  month: number; // 1-12
  label: string; // 「1月」
  count: number;
}

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);

/**
 * 按月份聚合事件数（1-12 月），用于热力图。
 * 不区分年份，仅看哪些月份更活跃。
 */
export function getMonthlyStats(events: LifeEvent[]): MonthStat[] {
  const counts = new Array(12).fill(0);
  for (const ev of events) {
    const m = new Date(ev.date).getMonth();
    if (isNaN(m)) continue;
    counts[m]++;
  }
  return counts.map((count, i) => ({
    month: i + 1,
    label: MONTH_LABELS[i],
    count,
  }));
}

// ============ 跨度与总览 ============
export interface OverviewStat {
  total: number;
  firstYear: number | null;
  lastYear: number | null;
  spanYears: number; // 首末年份跨度（含两端），无数据时为 0
  avgPerYear: number; // 平均每年事件数（保留 1 位小数），无数据时为 0
  topYear: { year: number; count: number } | null; // 事件最多的年份
  topCategory: CategoryStat | null; // 事件最多的分类
  pointCount: number;
  periodCount: number;
}

/**
 * 计算总体概览统计
 */
export function getOverviewStats(events: LifeEvent[]): OverviewStat {
  const total = events.length;
  const typeStat = getTypeStats(events);

  if (total === 0) {
    return {
      total: 0,
      firstYear: null,
      lastYear: null,
      spanYears: 0,
      avgPerYear: 0,
      topYear: null,
      topCategory: null,
      pointCount: 0,
      periodCount: 0,
    };
  }

  const yearly = getYearlyStats(events);
  const firstYear = yearly[0]?.year ?? null;
  const lastYear = yearly[yearly.length - 1]?.year ?? null;
  const spanYears = firstYear !== null && lastYear !== null ? lastYear - firstYear + 1 : 0;
  const avgPerYear = spanYears > 0 ? Math.round((total / spanYears) * 10) / 10 : 0;

  // 最活跃年份
  let topYear: OverviewStat['topYear'] = null;
  for (const y of yearly) {
    if (!topYear || y.count > topYear.count) {
      topYear = { year: y.year, count: y.count };
    }
  }

  // 最活跃分类
  const catStats = getCategoryStats(events);
  const topCategory = catStats[0] ?? null;

  return {
    total,
    firstYear,
    lastYear,
    spanYears,
    avgPerYear,
    topYear,
    topCategory,
    pointCount: typeStat.point,
    periodCount: typeStat.period,
  };
}

// ============ 热力图色阶 ============
/**
 * 根据数量在最小/最大区间内的位置，返回热力色阶等级（0-4）。
 * 0 = 无数据（最浅），4 = 最活跃（最深）。
 */
export function getHeatLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || max <= 0) return 0;
  const ratio = count / max;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}

// ============ 工具：安全获取分类定义 ============
// 重新导出，方便组件从单一入口访问
export { getCategory };
