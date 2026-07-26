import type { UserProfileInput, LifeEventInput, DatePrecision, Importance } from '@/types';
import { isValidDate } from './dateUtils';
import { DATE_PRECISIONS, IMPORTANCE_LEVELS } from './constants';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

// 校验用户档案输入
export function validateProfile(input: Partial<UserProfileInput>): ValidationResult {
  const errors: Record<string, string> = {};

  const name = (input.name ?? '').trim();
  if (!name) {
    errors.name = '请输入姓名';
  } else if (name.length > 30) {
    errors.name = '姓名不能超过 30 个字符';
  }

  if (!input.birthDate) {
    errors.birthDate = '请选择出生日期';
  } else if (!isValidDate(input.birthDate)) {
    errors.birthDate = '出生日期格式不正确';
  } else if (new Date(input.birthDate).getTime() > Date.now()) {
    errors.birthDate = '出生日期不能在未来';
  }

  if (input.bio && input.bio.length > 200) {
    errors.bio = '简介不能超过 200 个字符';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// 校验事件输入
export function validateEvent(input: Partial<LifeEventInput>): ValidationResult {
  const errors: Record<string, string> = {};

  const title = (input.title ?? '').trim();
  if (!title) {
    errors.title = '请输入事件标题';
  } else if (title.length > 50) {
    errors.title = '标题不能超过 50 个字符';
  }

  if (input.type !== 'point' && input.type !== 'period') {
    errors.type = '请选择时间点或时间区间';
  }

  // 起始日期与精度（均必填）
  if (!input.date) {
    errors.date = '请选择事件日期';
  } else if (!isValidDate(input.date)) {
    errors.date = '事件日期格式不正确';
  }
  if (!isDatePrecision(input.datePrecision)) {
    errors.datePrecision = '请选择日期精度';
  }

  // 重要程度（1-5）
  if (!isImportance(input.importance)) {
    errors.importance = '请选择重要程度';
  }

  const isPeriod = input.type === 'period';
  const isOngoing = input.isOngoing === true;
  if (isPeriod) {
    // 「至今」与结束日期互斥，未勾选至今时结束日期必填。
    if (isOngoing && input.endDate) {
      errors.endDate = '已选择「至今」时不能填写结束日期';
    }
    if (!isOngoing && !input.endDate) {
      errors.endDate = '请选择结束日期，或勾选「至今」';
    }
    if (input.endDate && !isValidDate(input.endDate)) {
      errors.endDate = '结束日期格式不正确';
    }
    if (input.endDate && !isDatePrecision(input.endDatePrecision)) {
      errors.endDatePrecision = '请选择结束日期精度';
    }
    if (
      input.date
      && input.endDate
      && isValidDate(input.date)
      && isValidDate(input.endDate)
      && new Date(input.endDate).getTime() < new Date(input.date).getTime()
    ) {
      errors.endDate = '结束日期不能早于起始日期';
    }
  } else {
    // 点事件不是区间，避免遗留字段造成数据语义冲突。
    if (input.isOngoing) errors.isOngoing = '时间点事件不能标记为「至今」';
    if (input.endDate) errors.endDate = '时间点事件不能填写结束日期';
  }

  if (input.description && input.description.length > 500) {
    errors.description = '描述不能超过 500 个字符';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

function isDatePrecision(value: unknown): value is DatePrecision {
  return DATE_PRECISIONS.some(item => item.key === value);
}

function isImportance(value: unknown): value is Importance {
  return IMPORTANCE_LEVELS.some(item => item.level === value);
}
