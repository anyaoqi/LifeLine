<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import StarRating from '@/components/ui/StarRating.vue'
import AppButton from '@/components/ui/AppButton.vue'
import PrecisionDatePicker from '@/components/EventForm/PrecisionDatePicker.vue'
import { useEventStore } from '@/stores/eventStore'
import { validateEvent } from '@/utils/validators'
import { calcDuration } from '@/utils/dateUtils'
import {
  CATEGORIES,
  DATE_PRECISIONS,
  DEFAULT_CATEGORY,
  DEFAULT_DATE_PRECISION,
  DEFAULT_IMPORTANCE,
} from '@/utils/constants'
import type {
  DatePrecision,
  EventCategory,
  EventType,
  Importance,
  LifeEvent,
  LifeEventInput,
} from '@/types'

/**
 * 事件表单面板(创建/编辑共用):
 *  - variant='quick' 快速记录:首屏只有 标题+时间,详细信息折叠,支持连续添加
 *  - variant='full'  编辑:全部字段展开
 * 校验即时反馈;日期按精度裁剪存储,不伪造记忆。
 */
interface Props {
  existing?: LifeEvent | null
  variant?: 'quick' | 'full'
  /** quick 模式:显示「保存并继续」 */
  continuous?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  existing: null,
  variant: 'full',
  continuous: false,
})
const emit = defineEmits<{ saved: [continued: boolean]; cancel: [] }>()

const eventStore = useEventStore()

const form = reactive({
  title: '',
  type: 'point' as EventType,
  date: '',
  datePrecision: DEFAULT_DATE_PRECISION as DatePrecision,
  endDate: '',
  endDatePrecision: DEFAULT_DATE_PRECISION as DatePrecision,
  isOngoing: false,
  importance: DEFAULT_IMPORTANCE as Importance,
  category: DEFAULT_CATEGORY as EventCategory,
  description: '',
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const showDetails = ref(props.variant === 'full')

function clearError(...keys: string[]) {
  for (const key of keys) delete errors.value[key]
}

function setPrecision(precisionField: 'datePrecision' | 'endDatePrecision', next: DatePrecision) {
  form[precisionField] = next
  clearError(precisionField)
}

const typeOptions = [
  { value: 'point' as const, label: '● 时间点', hint: '发生在某一天/月/年,如「毕业典礼」' },
  { value: 'period' as const, label: '▮ 区间', hint: '有起止的一段经历,如「上高中」' },
]
const precisionOptions = DATE_PRECISIONS.map(p => ({ value: p.key, label: p.label, hint: p.hint }))

watch(
  () => props.existing,
  (event) => {
    if (!event) {
      resetForm()
      return
    }
    form.title = event.title
    form.type = event.type ?? 'point'
    form.datePrecision = event.datePrecision ?? DEFAULT_DATE_PRECISION
    form.date = event.date ?? ''
    form.endDatePrecision = event.endDatePrecision ?? form.datePrecision
    form.endDate = event.endDate ?? ''
    form.isOngoing = event.isOngoing === true
    form.importance = event.importance ?? DEFAULT_IMPORTANCE
    form.category = event.category
    form.description = event.description ?? ''
    errors.value = {}
    showDetails.value = true
  },
  { immediate: true },
)

function resetForm() {
  form.title = ''
  form.type = 'point'
  form.date = toPrecisionInputValueLocal(new Date().toISOString(), 'day')
  form.datePrecision = 'day'
  form.endDate = ''
  form.endDatePrecision = 'day'
  form.isOngoing = false
  form.importance = DEFAULT_IMPORTANCE
  form.category = DEFAULT_CATEGORY
  form.description = ''
  errors.value = {}
}

// 点事件没有结束;「至今」与结束日期互斥
watch(() => form.type, (type) => {
  if (type === 'point') {
    form.endDate = ''
    form.isOngoing = false
    clearError('endDate', 'endDatePrecision', 'isOngoing')
  }
})
watch(() => form.isOngoing, (isOngoing) => {
  if (isOngoing) {
    form.endDate = ''
    clearError('endDate', 'endDatePrecision')
  }
})

/** 按精度裁剪为存储值:低精度只保留时间段起点作为排序锚点 */
function truncateToPrecision(iso: string, precision: DatePrecision): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = precision === 'year' ? 0 : date.getMonth()
  const day = precision === 'day' ? date.getDate() : 1
  return new Date(year, month, day, 12, 0, 0).toISOString()
}

function toPrecisionInputValueLocal(iso: string, precision: DatePrecision): string {
  const d = new Date(iso)
  const y = String(d.getFullYear())
  if (precision === 'year') return y
  const m = String(d.getMonth() + 1).padStart(2, '0')
  if (precision === 'month') return `${y}-${m}`
  return `${y}-${m}-${String(d.getDate()).padStart(2, '0')}`
}

const durationPreview = computed(() => {
  if (form.type !== 'period' || !form.date) return ''
  const start = truncateToPrecision(form.date, form.datePrecision)
  const end = form.isOngoing ? undefined : truncateToPrecision(form.endDate, form.endDatePrecision)
  return calcDuration(start, end, form.isOngoing)
})

const isPeriod = computed(() => form.type === 'period')

async function submit(continueAdding = false) {
  const isRange = form.type === 'period' && !form.isOngoing
  const input: LifeEventInput = {
    title: form.title.trim(),
    type: form.type,
    date: truncateToPrecision(form.date, form.datePrecision),
    datePrecision: form.datePrecision,
    endDate: isRange ? truncateToPrecision(form.endDate, form.endDatePrecision) : undefined,
    endDatePrecision: isRange ? form.endDatePrecision : undefined,
    isOngoing: form.type === 'period' ? form.isOngoing : undefined,
    importance: form.importance,
    category: form.category,
    description: form.description.trim() || undefined,
  }
  const result = validateEvent(input)
  errors.value = result.errors
  if (!result.valid) return

  submitting.value = true
  try {
    if (props.existing) {
      await eventStore.updateEvent(props.existing.id, input)
    } else {
      await eventStore.createEvent(input)
    }
    const shouldContinue = continueAdding && !props.existing
    if (shouldContinue) {
      // 连续添加:保留类型/精度/重要度/分类,只清标题与描述,光标回到标题
      const keep = {
        type: form.type,
        datePrecision: form.datePrecision,
        date: form.date,
        endDatePrecision: form.endDatePrecision,
        endDate: form.endDate,
        isOngoing: form.isOngoing,
        importance: form.importance,
        category: form.category,
      }
      resetForm()
      Object.assign(form, keep)
      showDetails.value = false
    }
    emit('saved', shouldContinue)
  } finally {
    submitting.value = false
  }
}

defineExpose({
  focusTitle: () => document.getElementById('event-title')?.focus(),
})
</script>

<template>
  <form class="space-y-5" @submit.prevent="submit(false)">
    <!-- 标题 -->
    <div>
      <label for="event-title" class="sr-only">事件标题</label>
      <input
        id="event-title"
        v-model.trim="form.title"
        type="text"
        maxlength="50"
        class="ef-title"
        :class="{ 'ef-title--invalid': errors.title }"
        placeholder="发生了什么?"
        autofocus
      />
      <p v-if="errors.title" class="mt-1 text-xs text-red-500">{{ errors.title }}</p>
    </div>

    <!-- 时间:形态 + 日期 + 精度 -->
    <fieldset class="ef-fieldset">
      <legend class="px-1 text-xs font-semibold text-app-ink-faint">时间</legend>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl
          :model-value="form.type"
          :options="typeOptions"
          @update:model-value="(v) => { form.type = v as EventType; clearError('type') }"
        />
        <label
          v-if="isPeriod"
          class="inline-flex cursor-pointer select-none items-center gap-1.5 text-xs text-app-ink-soft"
        >
          <input
            v-model="form.isOngoing"
            type="checkbox"
            class="h-3.5 w-3.5 rounded border-app-border-strong text-app-accent focus:ring-app-accent/30"
          />
          至今(尚未结束)
        </label>
      </div>
      <p v-if="errors.type" class="mt-1 text-xs text-red-500">{{ errors.type }}</p>

      <!-- 起始日期 -->
      <div class="mt-3">
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <label for="event-date" class="text-xs font-medium text-app-ink-soft">
            {{ isPeriod ? '开始' : '发生时间' }} <span class="text-red-400">*</span>
          </label>
          <SegmentedControl
            :model-value="form.datePrecision"
            :options="precisionOptions"
            size="sm"
            @update:model-value="(v) => setPrecision('datePrecision', v as DatePrecision)"
          />
        </div>
        <PrecisionDatePicker
          v-model="form.date"
          input-id="event-date"
          :precision="form.datePrecision"
          :invalid="!!(errors.date || errors.datePrecision)"
          @update:model-value="clearError('date', 'datePrecision')"
        />
        <p v-if="errors.date || errors.datePrecision" class="mt-1 text-xs text-red-500">
          {{ errors.date || errors.datePrecision }}
        </p>
      </div>

      <!-- 结束日期 -->
      <div v-if="isPeriod && !form.isOngoing" class="mt-3">
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <label for="event-end-date" class="text-xs font-medium text-app-ink-soft">
            结束 <span class="text-red-400">*</span>
          </label>
          <SegmentedControl
            :model-value="form.endDatePrecision"
            :options="precisionOptions"
            size="sm"
            @update:model-value="(v) => setPrecision('endDatePrecision', v as DatePrecision)"
          />
        </div>
        <PrecisionDatePicker
          v-model="form.endDate"
          input-id="event-end-date"
          :precision="form.endDatePrecision"
          :min-date="form.date || undefined"
          :invalid="!!(errors.endDate || errors.endDatePrecision)"
          @update:model-value="clearError('endDate', 'endDatePrecision')"
        />
      </div>

      <p
        v-if="errors.endDate || errors.endDatePrecision || errors.isOngoing"
        class="mt-1 text-xs text-red-500"
      >
        {{ errors.endDate || errors.endDatePrecision || errors.isOngoing }}
      </p>

      <div v-if="durationPreview" class="mt-2.5">
        <span class="ef-chip">时长 {{ durationPreview }}</span>
      </div>
    </fieldset>

    <!-- 详细信息(quick 模式默认折叠) -->
    <template v-if="showDetails">
      <!-- 重要程度 -->
      <div>
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <span class="text-sm font-medium text-app-ink">重要程度</span>
          <span class="text-[11px] text-app-ink-faint">大事在「只看大事」中优先呈现</span>
        </div>
        <StarRating v-model="form.importance" />
      </div>

      <!-- 分类 -->
      <div>
        <span class="mb-1.5 block text-sm font-medium text-app-ink">分类</span>
        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="cat in CATEGORIES"
            :key="cat.key"
            type="button"
            :class="[
              'flex items-center justify-center gap-1 rounded-lg border px-1.5 py-2 text-xs transition-all',
              form.category === cat.key
                ? 'border-transparent font-semibold'
                : 'border-app-border text-app-ink-faint hover:bg-app-bg-deep',
            ]"
            :style="
              form.category === cat.key
                ? { borderColor: cat.color, backgroundColor: cat.color + '1a', color: cat.color }
                : undefined
            "
            @click="form.category = cat.key"
          >
            <component :is="cat.icon" :size="14" />
            {{ cat.label }}
          </button>
        </div>
      </div>

      <!-- 描述 -->
      <div>
        <label for="event-desc" class="mb-1.5 block text-sm font-medium text-app-ink">
          描述 <span class="text-[11px] font-normal text-app-ink-faint">(选填)</span>
        </label>
        <textarea
          id="event-desc"
          v-model="form.description"
          rows="3"
          maxlength="500"
          class="ef-textarea"
          placeholder="当时的细节、心情、同行的人…"
        />
        <p class="mt-1 text-right text-xs text-app-ink-faint">
          {{ form.description.length }} / 500
        </p>
      </div>
    </template>

    <!-- 快速模式:展开详细信息 -->
    <button
      v-if="variant === 'quick'"
      type="button"
      class="inline-flex items-center gap-1 text-xs font-medium text-app-ink-faint transition-colors hover:text-app-accent"
      @click="showDetails = !showDetails"
    >
      <component :is="showDetails ? ChevronUp : ChevronDown" :size="13" />
      {{ showDetails ? '收起详细信息' : '添加详细信息(分类、重要程度…)' }}
    </button>

    <!-- 操作区 -->
    <div class="flex items-center justify-between gap-3 pt-1">
      <div class="flex gap-2">
        <slot name="delete" />
      </div>
      <div class="ml-auto flex gap-2">
        <AppButton variant="ghost" type="button" size="sm" @click="emit('cancel')">
          取消
        </AppButton>
        <AppButton
          v-if="continuous && variant === 'quick'"
          variant="secondary"
          type="button"
          size="sm"
          :disabled="submitting"
          @click="submit(true)"
        >
          保存并继续
        </AppButton>
        <AppButton type="submit" size="sm" :disabled="submitting">
          {{ submitting ? '保存中…' : (existing ? '保存修改' : '添加事件') }}
        </AppButton>
      </div>
    </div>
  </form>
</template>

<style scoped>
.ef-title {
  width: 100%;
  border: none;
  border-bottom: 1.5px solid var(--app-border);
  background: transparent;
  padding: 0.5rem 0.125rem;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--app-ink);
  transition: border-color 0.2s ease;
}
.ef-title:focus {
  outline: none;
  border-bottom-color: var(--app-accent);
}
.ef-title::placeholder {
  color: var(--app-ink-faint);
  font-weight: 400;
}
.ef-title--invalid {
  border-bottom-color: #d97b7b;
}

.ef-fieldset {
  border: 1px solid var(--app-border);
  border-radius: 0.75rem;
  padding: 0.875rem;
}

.ef-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: var(--app-accent-soft);
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--app-accent);
}

.ef-textarea {
  width: 100%;
  resize: none;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-raised);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--app-ink);
}
.ef-textarea:focus {
  outline: none;
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px var(--app-accent-soft);
}
.ef-textarea::placeholder {
  color: var(--app-ink-faint);
}
</style>
