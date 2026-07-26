import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import PrecisionDatePicker from '@/components/EventForm/PrecisionDatePicker.vue'
import type { DatePrecision } from '@/types'

beforeEach(() => {
  setActivePinia(createPinia())
})

function mountPicker(modelValue: string, precision: DatePrecision) {
  return mount(PrecisionDatePicker, {
    props: { modelValue, precision },
    attachTo: document.body,
  })
}

describe('PrecisionDatePicker', () => {
  it('日精度使用完整日期选择器并按年月日显示', async () => {
    const wrapper = mountPicker('2019-06-08T12:00:00.000Z', 'day')
    await nextTick()

    const input = wrapper.get('input')
    expect(input.element.value).toContain('2019年6月8日')
    wrapper.unmount()
  })

  it('月精度只显示年月', async () => {
    const wrapper = mountPicker('2016-09-01T12:00:00.000Z', 'month')
    await nextTick()

    const input = wrapper.get('input')
    expect(input.element.value).toBe('2016年9月')
    wrapper.unmount()
  })

  it('年精度只显示年份，不伪造月日', async () => {
    const wrapper = mountPicker('2003-01-01T12:00:00.000Z', 'year')
    await nextTick()

    const input = wrapper.get('input')
    expect(input.element.value).toBe('2003年')
    wrapper.unmount()
  })

  it('切换精度后同一日期的展示随之降级', async () => {
    const wrapper = mountPicker('2019-06-08T12:00:00.000Z', 'day')
    await nextTick()
    expect(wrapper.get('input').element.value).toContain('2019年6月8日')

    await wrapper.setProps({ precision: 'year' })
    await nextTick()
    expect(wrapper.get('input').element.value).toBe('2019年')

    wrapper.unmount()
  })

  it('空值时不显示任何日期文本', async () => {
    const wrapper = mountPicker('', 'day')
    await nextTick()

    expect(wrapper.get('input').element.value).toBe('')
    wrapper.unmount()
  })

  it('图标位于输入框之外，输入框内不再渲染内置图标', async () => {
    const wrapper = mountPicker('', 'day')
    await nextTick()

    // 前置图标是输入框的兄弟节点，而非叠加在输入框内部
    const icon = wrapper.get('span[aria-hidden="true"]')
    expect(icon.text()).toBe('📅')

    // 库的内置输入框图标已隐藏
    expect(wrapper.find('.dp--tp-wrap .dp__input_icon').exists()).toBe(false)
    expect(wrapper.find('.dp__input_icon').exists()).toBe(false)

    wrapper.unmount()
  })
})
