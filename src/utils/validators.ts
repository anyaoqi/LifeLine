import type { UserProfileInput, LifeEventInput } from '@/types';
import { isValidDate } from './dateUtils';

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

  // 起始日期（必填）
  if (!input.date) {
    errors.date = '请选择事件日期';
  } else if (!isValidDate(input.date)) {
    errors.date = '事件日期格式不正确';
  }

  // 时间区间事件：校验结束日期
  if (input.type === 'period') {
    if (!input.endDate) {
      errors.endDate = '请选择结束日期';
    } else if (!isValidDate(input.endDate)) {
      errors.endDate = '结束日期格式不正确';
    } else if (input.date && isValidDate(input.date)) {
      // 结束日期不能早于起始日期
      if (new Date(input.endDate).getTime() < new Date(input.date).getTime()) {
        errors.endDate = '结束日期不能早于起始日期';
      }
    }
  }

  if (input.description && input.description.length > 500) {
    errors.description = '描述不能超过 500 个字符';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
