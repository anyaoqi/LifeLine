// ============ 日期工具函数 ============

/**
 * 将 ISO 日期字符串格式化为中文显示：「2024年6月15日」
 * 输入非法时返回空字符串
 */
export function formatChineseDate(iso: string | undefined | null): string {
  if (!iso) return '';
  const d = parseDate(iso);
  if (!d) return '';
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
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
  if (!value) return '';
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return '';
  // 用本地正午构造，避免跨时区导致日期变化
  const date = new Date(y, m - 1, d, 12, 0, 0);
  return date.toISOString();
}

/**
 * 计算年龄（满岁）
 */
export function calcAge(birthIso: string | undefined | null): number {
  const birth = parseDate(birthIso);
  if (!birth) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
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
 * 格式化时间区间：起始日期 ~ 结束日期
 * 同年时省略结束年份：「2024年6月1日 ~ 8月30日」
 * 跨年时完整显示：「2010年9月1日 ~ 2016年6月30日」
 */
export function formatDateRange(startIso: string, endIso: string | undefined | null): string {
  const start = formatChineseDate(startIso);
  if (!start) return '';
  if (!endIso) return start;

  const endD = parseDate(endIso);
  if (!endD) return start;

  const startD = parseDate(startIso);
  // 同年省略结束年份
  if (startD && startD.getFullYear() === endD.getFullYear()) {
    return `${start} ~ ${endD.getMonth() + 1}月${endD.getDate()}日`;
  }
  return `${start} ~ ${formatChineseDate(endIso)}`;
}

/**
 * 计算时间区间的持续时长描述
 * 如：「3 年」「8 个月」「15 天」
 */
export function calcDuration(startIso: string, endIso: string | undefined | null): string {
  const start = parseDate(startIso);
  const end = parseDate(endIso);
  if (!start || !end) return '';

  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return '';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return '当天';
  if (days < 30) return `${days} 天`;
  if (days < 365) return `${Math.floor(days / 30)} 个月`;

  const years = Math.floor(days / 365);
  const remainMonths = Math.floor((days % 365) / 30);
  if (remainMonths === 0) return `${years} 年`;
  return `${years} 年 ${remainMonths} 个月`;
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

// 解析 ISO 字符串为 Date，非法返回 null
function parseDate(iso: string | undefined | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}
