// ============ 事件类型（Phase 2） ============
// point: 时间点事件（如「毕业典礼」）
// period: 时间区间事件（如「2010-2016 小学」）
export type EventType = 'point' | 'period';

// ============ 日期精度（v0.4.0） ============
// 回忆往事时日期精度天然不一致：结婚记得到天，上幼儿园可能只记得年份。
// 精度需如实保存与展示，不把「2003 年」显示成「2003年1月1日」。
export type DatePrecision = 'year' | 'month' | 'day';

// ============ 重要程度（v0.4.0） ============
// 1=日常小事 2=值得记 3=重要 4=大事 5=人生里程碑
// 用于「只看大事」筛选与时间轴视觉分层，避免小事淹没人生主干。
export type Importance = 1 | 2 | 3 | 4 | 5;

// ============ 事件分类（MVP） ============
// 对应 设计理念与UI指南.md 中的事件分类色
export type EventCategory =
  | 'education'   // 学业
  | 'work'        // 工作
  | 'life'        // 生活
  | 'travel'      // 旅行
  | 'love'        // 感情
  | 'health'      // 健康
  | 'achievement' // 成就
  | 'other';      // 其他

// ============ 主题 ============
export type Theme = 'light' | 'dark' | 'auto';

// ============ 用户档案 ============
export interface UserProfile {
  id: string;
  name: string;                    // 用户名（必填）
  birthDate: string;               // 出生日期 ISO 格式（必填）
  bio?: string;                    // 个人简介
  avatar?: string;                 // 头像图片 URL
  createdAt: string;
  updatedAt: string;
}

// ============ 生活事件 ============
// 支持「时间点」和「时间区间」两种类型
export interface LifeEvent {
  id: string;
  userId: string;
  title: string;                   // 事件标题（必填）
  type: EventType;                 // 事件类型：时间点 / 时间区间
  date: string;                    // 事件日期（起始日期）ISO 格式（必填）
  datePrecision: DatePrecision;    // 起始日期精度（v0.4.0，旧数据默认 'day'）
  endDate?: string;                // 结束日期（仅 type='period' 时有效）ISO 格式
  endDatePrecision?: DatePrecision;// 结束日期精度（v0.4.0，允许与起始不同）
  isOngoing?: boolean;             // 区间尚未结束（「至今」），与 endDate 互斥
  importance: Importance;          // 重要程度（v0.4.0，旧数据默认 3）
  description?: string;            // 事件描述
  category: EventCategory;         // 事件分类
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;              // 软删除时间（v0.4.0，支撑 30 秒撤销）
}

// ============ 应用状态 ============
export interface AppState {
  user: UserProfile | null;
  events: LifeEvent[];
  loading: boolean;
  error: string | null;
}

// ============ 表单输入类型（创建/更新时使用） ============
export type UserProfileInput = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>;
export type LifeEventInput = Omit<
  LifeEvent,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;
