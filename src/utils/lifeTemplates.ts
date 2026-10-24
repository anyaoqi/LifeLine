import type { EventCategory, EventType, Importance, LifeEventInput } from '@/types'

/**
 * 人生阶段模板:按「出生 + 年龄锚点」生成事件草稿(isDraft),
 * 解决冷启动要手打 20 条的最大阻力。日期精度一律 year(记不清很正常,
 * 用户确认草稿时可以改),区间按年数推算。
 */

export interface TemplateItem {
  title: string
  category: EventCategory
  type: EventType
  /** 起始年龄(周岁) */
  age: number
  /** 区间持续年数;type='period' 时必填 */
  years?: number
  /** 区间是否「至今」 */
  ongoing?: boolean
  importance: Importance
  description?: string
}

export interface LifeTemplate {
  key: string
  name: string
  tagline: string
  icon: 'graduation' | 'briefcase' | 'heart' | 'home'
  items: TemplateItem[]
}

export const LIFE_TEMPLATES: LifeTemplate[] = [
  {
    key: 'education',
    name: '学业历程',
    tagline: '从幼儿园到毕业的完整骨架',
    icon: 'graduation',
    items: [
      { title: '上幼儿园', category: 'education', type: 'period', age: 3, years: 3, importance: 2, description: '人生第一段集体生活' },
      { title: '小学入学', category: 'education', type: 'period', age: 6, years: 6, importance: 3 },
      { title: '上初中', category: 'education', type: 'period', age: 12, years: 3, importance: 3 },
      { title: '上高中', category: 'education', type: 'period', age: 15, years: 3, importance: 4 },
      { title: '大学毕业', category: 'education', type: 'point', age: 22, importance: 5, description: '人生的一个重要节点' },
    ],
  },
  {
    key: 'career',
    name: '职业之路',
    tagline: '实习、第一份工作到独当一面',
    icon: 'briefcase',
    items: [
      { title: '第一份实习', category: 'work', type: 'period', age: 20, years: 1, importance: 3, description: '第一次走进职场' },
      { title: '第一份正式工作', category: 'work', type: 'period', age: 22, ongoing: true, importance: 5 },
      { title: '第一次独立负责项目', category: 'achievement', type: 'point', age: 24, importance: 4 },
    ],
  },
  {
    key: 'love',
    name: '感情里程碑',
    tagline: '遇见、相恋与承诺',
    icon: 'heart',
    items: [
      { title: '遇见重要的人', category: 'love', type: 'point', age: 20, importance: 4 },
      { title: '在一起', category: 'love', type: 'point', age: 21, importance: 5 },
      { title: '第一次一起旅行', category: 'love', type: 'point', age: 22, importance: 3 },
    ],
  },
  {
    key: 'life',
    name: '生活大事',
    tagline: '搬家、首次独立与家庭记忆',
    icon: 'home',
    items: [
      { title: '第一次离开家', category: 'life', type: 'point', age: 18, importance: 4, description: '去外地读书 / 工作' },
      { title: '有了自己的房间', category: 'life', type: 'period', age: 22, years: 2, importance: 3 },
      { title: '养了第一只宠物', category: 'life', type: 'point', age: 25, importance: 3 },
    ],
  },
]

/** 年龄锚点 → ISO 日期(出生年份 + age,取 9 月 1 日正午作为排序锚点) */
function ageToIso(birthIso: string, age: number): string {
  const birth = new Date(birthIso)
  const year = birth.getFullYear() + age
  return new Date(year, 8, 1, 12, 0, 0).toISOString()
}

export function buildDraftEvents(
  template: LifeTemplate,
  birthIso: string | undefined | null,
): LifeEventInput[] {
  if (!birthIso) return []
  return template.items.map(item => {
    const start = ageToIso(birthIso, item.age)
    const isPeriod = item.type === 'period'
    // 未来还没发生的阶段(如 5 岁娃的大学)不做 ongoing
    const endIso =
      isPeriod && !item.ongoing && item.years
        ? ageToIso(birthIso, item.age + item.years)
        : undefined
    const ongoing = isPeriod && item.ongoing === true && new Date(start).getTime() <= Date.now()
    return {
      title: item.title,
      type: item.type,
      date: start,
      datePrecision: 'year' as const,
      endDate: isPeriod && !ongoing ? endIso : undefined,
      endDatePrecision: isPeriod && !ongoing ? ('year' as const) : undefined,
      isOngoing: isPeriod ? ongoing : undefined,
      importance: item.importance,
      category: item.category,
      description: item.description,
      isDraft: true,
    }
  })
}

/** 草稿预览:把模板展开为「YYYY 开始 · 标题」的行,供选择器展示 */
export function previewTemplate(
  template: LifeTemplate,
  birthIso: string | undefined | null,
): { year: number; title: string }[] {
  if (!birthIso) return []
  const birthYear = new Date(birthIso).getFullYear()
  return template.items.map(item => ({
    year: birthYear + item.age,
    title: item.title,
  }))
}
