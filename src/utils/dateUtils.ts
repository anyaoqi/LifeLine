import type { DatePrecision } from '@/types';

// ============ 日期工具函数 ============

/**
 * 将 ISO 日期按用户记录的精度格式化为中文。
 * 精度低时绝不补出不存在的月/日，避免伪造记忆。
 */
export function formatChineseDate(
  iso: string | undefined | null,
  precision: DatePrecision = 'day'
): string {
  if (!iso) return '';
  const d = parseDate(iso);
  if (!d) return '';
  const year = d.getFullYear();
  if (precision === 'year') return `${year}年`;
  const month = d.getMonth() + 1;
  if (precision === 'month') return `${year}年${month}月`;
  return `${year}年${month}月${d.getDate()}日`;
}

/**
 * 取得适合所选精度的表单输入值：year -> YYYY、month -> YYYY-MM、day -> YYYY-MM-DD。
 */
export function toPrecisionInputValue(
  iso: string | undefined | null,
  precision: DatePrecision
): string {
  const d = parseDate(iso);
  if (!d) return '';
  const year = String(d.getFullYear());
  if (precision === 'year') return year;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  if (precision === 'month') return `${year}-${month}`;
  return `${year}-${month}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 将 year/month/date 输入统一存为本地正午的 ISO 字符串。
 * 展示时由 datePrecision 裁剪，因此补齐值只是排序锚点，不会暴露给用户。
 */
export function fromPrecisionInputValue(value: string, precision: DatePrecision): string {
  if (!value) return '';
  const parts = value.split('-').map(Number);
  const year = parts[0];
  const month = precision === 'year' ? 1 : parts[1];
  const day = precision === 'day' ? parts[2] : 1;
  if (!year || !month || !day) return '';
  const date = new Date(year, month - 1, day, 12, 0, 0);
  // 防止 Date 自动纠正非法输入（如 2024-02-31）。
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return '';
  }
  return date.toISOString();
}

/**
 * 格式化为带年份的短格式：用于年份分组标题等
 */
export function getYear(iso: string | undefined | null): number | null {
  const d = parseDate(iso);
  return d ? d.getFullYear() : null;
}

/**
 * 将 ISO 日期字符串转换为 `<input type="date">` 所需的 yyyy-mm-dd 格式
 */
export function toDateInputValue(iso: string | undefined | null): string {
  const d = parseDate(iso);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 将 input 控件的 yyyy-mm-dd 值转换为 ISO 字符串（本地时区，避免时差偏移）
 */
export function fromDateInputValue(value: string): string {
  return fromPrecisionInputValue(value, 'day');
}

/**
 * 计算年龄（满岁）
 */
export function calcAge(birthIso: string | undefined | null): number {
  const birth = parseDate(birthIso);
  if (!birth) return 0;
  return getFullYearsBetween(birth, new Date());
}

/**
 * 格式化事件发生时的年龄，并按照事件日期精度避免虚假的精确度。
 * 例如：day ->「12 岁 3 个月」；year/month ->「约 12 岁」。
 */
export function formatAgeAtDate(
  birthIso: string | undefined | null,
  eventIso: string | undefined | null,
  precision: DatePrecision = 'day'
): string {
  const birth = parseDate(birthIso);
  const event = parseDate(eventIso);
  if (!birth || !event || event < birth) return '';

  const years = getFullYearsBetween(birth, event);
  if (precision !== 'day') return `约 ${years} 岁`;

  let months = (event.getFullYear() - birth.getFullYear()) * 12
    + event.getMonth() - birth.getMonth();
  if (event.getDate() < birth.getDate()) months--;
  const remainingMonths = Math.max(0, months - years * 12);
  return remainingMonths ? `${years} 岁 ${remainingMonths} 个月` : `${years} 岁`;
}

/**
 * 计算两个日期之间的相对描述（用于"距今多久"）
 */
export function relativeTime(iso: string | undefined | null): string {
  const d = parseDate(iso);
  if (!d) return '';
  const now = new Date();
  const ms = now.getTime() - d.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 0) {
    const future = Math.abs(days);
    if (future < 30) return `${future} 天后`;
    if (future < 365) return `${Math.floor(future / 30)} 个月后`;
    return `${Math.floor(future / 365)} 年后`;
  }
  if (days === 0) return '今天';
  if (days < 30) return `${days} 天前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return `${Math.floor(days / 365)} 年前`;
}

/**
 * 格式化时间区间。起止日期精度可独立，未结束区间显示「至今」。
 */
export function formatDateRange(
  startIso: string,
  endIso: string | undefined | null,
  startPrecision: DatePrecision = 'day',
  endPrecision: DatePrecision = startPrecision,
  isOngoing = false
): string {
  const start = formatChineseDate(startIso, startPrecision);
  if (!start) return '';
  if (isOngoing) return `${start} – 至今`;
  if (!endIso) return start;

  const end = formatChineseDate(endIso, endPrecision);
  return end ? `${start} – ${end}` : start;
}

/**
 * 计算时间区间的持续时长。按自然日/月计算，不用 30/365 天粗略换算：
 * 「8 天」「3 个月」「4 年 2 个月」。end 缺失且 isOngoing 时计算到今天。
 */
export function calcDuration(
  startIso: string,
  endIso: string | undefined | null,
  isOngoing = false
): string {
  const start = parseDate(startIso);
  const end = endIso ? parseDate(endIso) : (isOngoing ? new Date() : null);
  if (!start || !end) return '';

  const startDay = startOfLocalDay(start);
  const endDay = startOfLocalDay(end);
  const diffDays = Math.floor((endDay.getTime() - startDay.getTime()) / 86_400_000);
  if (diffDays < 0) return '';
  if (diffDays === 0) return '当天';
  if (diffDays < 31) return `${diffDays} 天`;

  let months = (endDay.getFullYear() - startDay.getFullYear()) * 12
    + endDay.getMonth() - startDay.getMonth();
  if (endDay.getDate() < startDay.getDate()) months--;

  // 不满一个完整自然月时，仍使用天作为单位。
  if (months <= 0) return `${diffDays} 天`;
  if (months < 12) return `${months} 个月`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths ? `${years} 年 ${remainingMonths} 个月` : `${years} 年`;
}

/**
 * 校验是否为合法日期
 */
export function isValidDate(value: string | undefined | null): boolean {
  return !!parseDate(value);
}

/**
 * 判断日期是否在未来
 */
export function isFuture(iso: string | undefined | null): boolean {
  const d = parseDate(iso);
  if (!d) return false;
  return d.getTime() > Date.now();
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getFullYearsBetween(start: Date, end: Date): number {
  let years = end.getFullYear() - start.getFullYear();
  if (
    end.getMonth() < start.getMonth()
    || (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())
  ) {
    years--;
  }
  return Math.max(0, years);
}

// 解析 ISO 字符串为 Date，非法返回 null
function parseDate(iso: string | undefined | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}
