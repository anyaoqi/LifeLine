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
    // v2: 新增 type / endDate 字段（无需新增索引，仅升级版本号标记结构变更）
    // 旧数据会在读取时自动补全 type='point'，详见 normalizeEvent
    this.version(2).stores({
      users: 'id',
      events: 'id, userId, date',
    });
  }
}

/**
 * 数据兼容处理：给缺少 type 字段的旧事件补全默认值
 * MVP 阶段创建的事件没有 type/endDate 字段，升级后统一为时间点事件
 */
function normalizeEvent(event: LifeEvent): LifeEvent {
  if (!event.type) {
    event.type = 'point';
  }
  // type 为 point 时清理可能残留的 endDate
  if (event.type === 'point') {
    delete event.endDate;
  }
  return event;
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
    return events.map(normalizeEvent);
  },

  // 按日期排序获取事件
  async getEventsByUserSorted(userId: string): Promise<LifeEvent[]> {
    const events = await db.events.where('userId').equals(userId).toArray();
    return events
      .map(normalizeEvent)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  // 获取单个事件
  async getEvent(eventId: string): Promise<LifeEvent | undefined> {
    return db.events.get(eventId);
  },

  // 添加事件
  async addEvent(event: LifeEvent): Promise<string> {
    return db.events.add(event);
  },

  // 更新事件
  async updateEvent(event: LifeEvent): Promise<number> {
    return db.events.put(event);
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
    return events.filter(
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
