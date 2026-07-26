import Dexie, { type Table } from 'dexie';
import type { UserProfile, LifeEvent } from '@/types';

// 定义数据库
class LifePointDB extends Dexie {
  users!: Table<UserProfile>;
  events!: Table<LifeEvent>;

  constructor() {
    super('LifePointDB');
    // v1: MVP 基础结构
    this.version(1).stores({
      users: 'id',
      events: 'id, userId, date',
    });
    // v2: 新增 type / endDate 字段（旧数据在读取时补全）
    this.version(2).stores({
      users: 'id',
      events: 'id, userId, date',
    });
    // v3: 日期精度、重要程度、未结束区间和软删除。
    // upgrade 持久化默认值；normalizeEvent 则作为导入数据及异常中断升级的兜底。
    this.version(3).stores({
      users: 'id',
      events: 'id, userId, date, importance, deletedAt',
    }).upgrade((tx) => tx.table('events').toCollection().modify((event: Partial<LifeEvent>) => {
      event.type ??= 'point';
      event.datePrecision ??= 'day';
      event.importance ??= 3;
      event.isOngoing ??= false;

      if (event.type === 'point') {
        delete event.endDate;
        delete event.endDatePrecision;
        delete event.isOngoing;
      } else if (event.isOngoing) {
        delete event.endDate;
        delete event.endDatePrecision;
      } else if (event.endDate) {
        event.endDatePrecision ??= event.datePrecision;
      }
    }));
  }
}

/**
 * 数据兼容和约束处理：
 * - v1/v2 事件补齐 v0.4.0 必填默认值
 * - point 没有结束日期；ongoing period 没有结束日期
 * - 不修改传入对象，避免 Pinia 响应式状态被意外写入
 */
export function normalizeEvent(event: LifeEvent): LifeEvent {
  const normalized: LifeEvent = {
    ...event,
    type: event.type ?? 'point',
    datePrecision: event.datePrecision ?? 'day',
    importance: event.importance ?? 3,
    isOngoing: event.isOngoing ?? false,
  };

  if (normalized.type === 'point') {
    delete normalized.endDate;
    delete normalized.endDatePrecision;
    delete normalized.isOngoing;
  } else if (normalized.isOngoing) {
    delete normalized.endDate;
    delete normalized.endDatePrecision;
  } else if (normalized.endDate) {
    normalized.endDatePrecision ??= normalized.datePrecision;
  }

  return normalized;
}

// 创建数据库实例
export const db = new LifePointDB();

// 用户相关操作
export const userService = {
  // 获取用户档案
  async getUser(userId: string): Promise<UserProfile | undefined> {
    return db.users.get(userId);
  },

  // 保存或更新用户档案
  async saveUser(user: UserProfile): Promise<string> {
    return db.users.put(user);
  },

  // 删除用户档案
  async deleteUser(userId: string): Promise<void> {
    return db.users.delete(userId);
  },
};

// 事件相关操作
export const eventService = {
  // 获取用户的所有事件
  async getEventsByUser(userId: string): Promise<LifeEvent[]> {
    const events = await db.events.where('userId').equals(userId).toArray();
    return events
      .map(normalizeEvent)
      .filter(event => !event.deletedAt);
  },

  // 按日期排序获取事件
  async getEventsByUserSorted(userId: string): Promise<LifeEvent[]> {
    const events = await db.events.where('userId').equals(userId).toArray();
    return events
      .map(normalizeEvent)
      .filter(event => !event.deletedAt)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  // 获取单个事件
  async getEvent(eventId: string): Promise<LifeEvent | undefined> {
    const event = await db.events.get(eventId);
    return event ? normalizeEvent(event) : undefined;
  },

  // 添加事件
  async addEvent(event: LifeEvent): Promise<string> {
    return db.events.add(normalizeEvent(event));
  },

  // 更新事件
  async updateEvent(event: LifeEvent): Promise<number> {
    return db.events.put(normalizeEvent(event));
  },

  // 删除事件
  async deleteEvent(eventId: string): Promise<void> {
    return db.events.delete(eventId);
  },

  // 批量删除用户的所有事件
  async deleteEventsByUser(userId: string): Promise<number> {
    return db.events.where('userId').equals(userId).delete();
  },

  // 搜索事件
  async searchEvents(userId: string, keyword: string): Promise<LifeEvent[]> {
    const events = await db.events.where('userId').equals(userId).toArray();
    const normalizedEvents = events
      .map(normalizeEvent)
      .filter(event => !event.deletedAt);
    return normalizedEvents.filter(
      e =>
        e.title.toLowerCase().includes(keyword.toLowerCase()) ||
        e.description?.toLowerCase().includes(keyword.toLowerCase())
    );
  },

  // 生成唯一 ID
  generateId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  },
};

// localStorage 工具函数
export const storageUtils = {
  // 存储主题偏好
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    localStorage.setItem('theme', theme);
  },

  // 获取主题偏好
  getTheme(): 'light' | 'dark' | 'auto' {
    return (localStorage.getItem('theme') as any) || 'auto';
  },

  // 存储当前用户ID
  setCurrentUserId(userId: string): void {
    localStorage.setItem('currentUserId', userId);
  },

  // 获取当前用户ID
  getCurrentUserId(): string | null {
    return localStorage.getItem('currentUserId');
  },

  // 清除所有本地数据
  clearAll(): void {
    localStorage.clear();
  },
};
