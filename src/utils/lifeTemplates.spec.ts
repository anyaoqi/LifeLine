import { describe, expect, it } from 'vitest'
import { buildDraftEvents, previewTemplate, LIFE_TEMPLATES } from './lifeTemplates'

const BIRTH = '1995-06-15T12:00:00.000Z'

describe('buildDraftEvents 人生模板草稿生成', () => {
  it('按年龄锚点换算年份,精度为 year', () => {
    const tpl = LIFE_TEMPLATES.find(t => t.key === 'education')!
    const drafts = buildDraftEvents(tpl, BIRTH)
    expect(drafts.length).toBe(tpl.items.length)
    expect(drafts.every(d => d.isDraft === true)).toBe(true)
    expect(drafts.every(d => d.datePrecision === 'year')).toBe(true)
    // 幼儿园 3 岁 → 1998
    const kindergarten = drafts.find(d => d.title === '上幼儿园')!
    expect(new Date(kindergarten.date).getFullYear()).toBe(1998)
  })

  it('区间草稿按年数推算结束;过去时才允许「至今」', () => {
    const tpl = LIFE_TEMPLATES.find(t => t.key === 'education')!
    const drafts = buildDraftEvents(tpl, BIRTH)
    const primary = drafts.find(d => d.title === '小学入学')!
    expect(primary.type).toBe('period')
    expect(primary.endDate).toBeTruthy()
    expect(new Date(primary.endDate!).getFullYear()).toBe(2007) // 6+6
    expect(primary.isOngoing).toBe(false)
  })

  it('出生日期缺失时返回空数组', () => {
    const tpl = LIFE_TEMPLATES[0]
    expect(buildDraftEvents(tpl, null)).toEqual([])
    expect(buildDraftEvents(tpl, undefined)).toEqual([])
  })

  it('所有模板生成日期都不晚于现在或标注合理(不以草稿伪造未来「至今」)', () => {
    for (const tpl of LIFE_TEMPLATES) {
      for (const draft of buildDraftEvents(tpl, BIRTH)) {
        if (draft.type === 'period' && draft.isOngoing) {
          expect(new Date(draft.date).getTime()).toBeLessThanOrEqual(Date.now())
        }
      }
    }
  })
})

describe('previewTemplate', () => {
  it('输出「出生年 + 年龄」的预览行', () => {
    const tpl = LIFE_TEMPLATES.find(t => t.key === 'education')!
    const rows = previewTemplate(tpl, BIRTH)
    expect(rows[0]).toEqual({ year: 1998, title: '上幼儿园' })
  })

  it('无出生日期时为空', () => {
    expect(previewTemplate(LIFE_TEMPLATES[0], null)).toEqual([])
  })
})
