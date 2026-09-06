<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import BirthDatePicker from '@/components/Profile/BirthDatePicker.vue'
import { useUserStore } from '@/stores/userStore'
import { validateProfile } from '@/utils/validators'
import { calcAge, formatChineseDate } from '@/utils/dateUtils'
import type { UserProfile } from '@/types'

interface Props {
  // 传入则为编辑模式，不传为创建模式
  existing?: UserProfile | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ saved: [user: UserProfile] }>()

const userStore = useUserStore()

const STEPS = [
  { key: 'name', title: '怎么称呼你？', hint: '时间线和问候语里会用到这个名字' },
  { key: 'birth', title: '哪天出生的？', hint: '用来计算年龄，锚定时间线的起点' },
  { key: 'bio', title: '介绍一下自己', hint: '一句话就好，也可以跳过' },
] as const

const step = ref(0)

const form = reactive({
  name: '',
  birthDate: '',
  bio: '',
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const nameInput = ref<HTMLInputElement | null>(null)

// 初始化表单数据（编辑模式回填）
watch(
  () => props.existing,
  (user) => {
    if (user) {
      form.name = user.name
      // BirthDatePicker 内部按 ISO 解析；toDateInputValue 只是取 yyyy-mm-dd，
      // 这里需要 ISO：已有 birthDate 本就是 ISO，直接用即可
      form.birthDate = user.birthDate ?? ''
      form.bio = user.bio ?? ''
    }
  },
  { immediate: true },
)

const isEditMode = computed(() => !!props.existing)
const progress = computed(() => ((step.value + 1) / STEPS.length) * 100)
const initials = computed(() => (form.name.trim().charAt(0).toUpperCase() || '?'))
const previewBirth = computed(() =>
  form.birthDate ? formatChineseDate(form.birthDate, 'day') : '还没选日期',
)
const previewAge = computed(() => (form.birthDate ? `${calcAge(form.birthDate)} 岁` : '—'))

function focusName() {
  nextTick(() => nameInput.value?.focus())
}

watch(step, (s) => {
  if (s === 0) focusName()
}, { immediate: true })

/** 校验单步：只设置当步的 error，通过才允许下一步 */
function validateStep(index: number): boolean {
  if (index === 0) {
    const name = form.name.trim()
    if (!name) {
      errors.value = { name: '先告诉我们你的名字吧' }
      return false
    }
    if (name.length > 30) {
      errors.value = { name: '名字不能超过 30 个字符' }
      return false
    }
    errors.value = {}
    return true
  }
  if (index === 1) {
    const result = validateProfile({
      name: form.name.trim() || '占位',
      birthDate: form.birthDate || undefined,
    })
    if (result.errors.birthDate) {
      errors.value = { birthDate: result.errors.birthDate }
      return false
    }
    // 出生日期不能在未来：validateProfile 已覆盖，这里补一条更口语的提示
    errors.value = {}
    return true
  }
  return true
}

function next() {
  if (!validateStep(step.value)) {
    if (step.value === 0) focusName()
    return
  }
  if (step.value < STEPS.length - 1) step.value += 1
}

function prev() {
  errors.value = {}
  if (step.value > 0) step.value -= 1
}

/** 允许点击已通过的步骤点回跳，前进仍需逐地校验 */
function goTo(index: number) {
  if (index === step.value) return
  if (index < step.value) {
    errors.value = {}
    step.value = index
    return
  }
  // 逐个校验后才能往前跳
  for (let i = step.value; i < index; i++) {
    if (!validateStep(i)) {
      step.value = i
      return
    }
  }
  step.value = index
}

function onBirthUpdate(iso: string) {
  form.birthDate = iso
  if (iso && errors.value.birthDate) {
    errors.value = Object.fromEntries(
      Object.entries(errors.value).filter(([key]) => key !== 'birthDate'),
    )
  }
}

async function handleSubmit() {
  console.log('DEBUG: handleSubmit called!')
  const input = {
    name: form.name.trim(),
    birthDate: form.birthDate,
    bio: form.bio.trim() || undefined,
  }
  const result = validateProfile(input)
  errors.value = result.errors
  if (!result.valid) {
    // 跳回第一个出错的步骤，聚焦问题
    if (result.errors.name) step.value = 0
    else if (result.errors.birthDate) step.value = 1
    else step.value = 2
    if (step.value === 0) focusName()
    return
  }

  submitting.value = true
  try {
    let saved: UserProfile
    if (props.existing) {
      const updated = await userStore.updateUser(input)
      saved = updated!
    } else {
      saved = await userStore.createUser(input)
    }
    emit('saved', saved)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <!-- 进度 -->
    <div class="mb-6">
      <div class="mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>第 {{ step + 1 }} 步 / 共 {{ STEPS.length }} 步</span>
        <span>{{ isEditMode ? '编辑档案' : '创建档案' }}</span>
      </div>
      <div
        class="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"
        role="progressbar"
        :aria-valuenow="step + 1"
        aria-valuemin="1"
        :aria-valuemax="STEPS.length"
      >
        <div
          class="h-full rounded-full bg-primary-400 transition-all duration-300"
          :style="{ width: `${progress}%` }"
        />
      </div>
      <ol class="mt-3 flex items-center gap-1.5 sm:gap-2">
        <li v-for="(s, i) in STEPS" :key="s.key" class="flex flex-1 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            :aria-label="`前往${s.title}`"
            :aria-current="i === step ? 'step' : undefined"
            class="flex flex-1 items-center gap-1.5 rounded p-0.5 sm:gap-2"
            @click="goTo(i)"
          >
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors"
              :class="i < step
                ? 'bg-primary-400 text-white'
                : i === step
                  ? 'bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900/40'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'"
            >
              <span v-if="i < step">✓</span>
              <span v-else>{{ i + 1 }}</span>
            </span>
            <span
              class="hidden truncate text-xs sm:inline"
              :class="i === step
                ? 'font-medium text-gray-800 dark:text-gray-100'
                : 'text-gray-400'"
            >
              {{ i === 0 ? '称呼' : i === 1 ? '出生日期' : '简介' }}
            </span>
          </button>
          <span
            v-if="i < STEPS.length - 1"
            class="h-px w-3 flex-shrink-0 sm:w-6"
            :class="i < step ? 'bg-primary-400' : 'bg-gray-200 dark:bg-gray-700'"
          />
        </li>
      </ol>
    </div>

    <!-- 标题 -->
    <div class="mb-5 text-center">
      <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">
        {{ STEPS[step].title }}
      </h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ STEPS[step].hint }}
      </p>
    </div>

    <form @submit.prevent="step === STEPS.length - 1 ? handleSubmit() : next()">
      <div class="min-h-44">
        <!-- Step 1: 姓名 -->
        <div v-if="step === 0">
          <label for="profile-name" class="sr-only">姓名</label>
          <input
            id="profile-name"
            ref="nameInput"
            v-model.trim="form.name"
            type="text"
            maxlength="30"
            autocomplete="nickname"
            class="input-base !py-3 text-center text-lg"
            placeholder="比如：小满"
            :class="{ '!border-red-400 !ring-red-400': errors.name }"
            @keydown.enter.prevent="next"
          />
          <p v-if="errors.name" class="mt-2 text-center text-sm text-red-500">{{ errors.name }}</p>
          <p v-else class="mt-2 text-center text-xs text-gray-400">
            {{ form.name.trim().length }} / 30 · 回车可直接下一步
          </p>
        </div>

        <!-- Step 2: 出生日期 -->
        <div v-if="step === 1">
          <BirthDatePicker
            :model-value="form.birthDate"
            :invalid="!!errors.birthDate"
            input-id="profile-birth"
            @update:model-value="onBirthUpdate"
          />
          <p v-if="errors.birthDate" class="mt-1 text-center text-sm text-red-500">{{ errors.birthDate }}</p>
        </div>

        <!-- Step 3: 简介 + 预览 -->
        <div v-if="step === 2" class="space-y-4">
          <div>
            <label for="profile-bio" class="sr-only">个人简介</label>
            <textarea
              id="profile-bio"
              v-model="form.bio"
              rows="3"
              maxlength="200"
              class="input-base resize-none"
              placeholder="简单介绍一下自己（选填，比如：在杭州做设计，喜欢爬山）"
            ></textarea>
            <div class="mt-1 flex items-center justify-between text-xs">
              <span v-if="errors.bio" class="text-red-500">{{ errors.bio }}</span>
              <span v-else />
              <span class="text-gray-400">{{ form.bio.length }} / 200</span>
            </div>
          </div>

          <!-- 实时预览 -->
          <div class="rounded-lg bg-primary-50 p-4 dark:bg-gray-700/50" aria-live="polite">
            <div class="flex items-center gap-3">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-xl font-semibold text-white"
              >
                {{ initials }}
              </div>
              <div class="min-w-0">
                <div class="truncate font-semibold text-gray-800 dark:text-gray-100">
                  {{ form.name.trim() || '（名字）' }}
                </div>
                <div class="truncate text-xs text-gray-500 dark:text-gray-400">
                  🎂 {{ previewBirth }} · {{ previewAge }}
                </div>
              </div>
            </div>
            <p v-if="form.bio.trim()" class="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {{ form.bio.trim() }}
            </p>
          </div>
        </div>
      </div>

      <!-- 操作区 -->
      <div class="mt-6 flex items-center justify-between gap-3">
        <div>
          <button
            v-if="step > 0"
            type="button"
            class="btn-ghost !px-2 text-sm"
            @click="prev"
          >
            ← 上一步
          </button>
          <slot v-else name="cancel" />
        </div>

        <div class="flex items-center gap-3">
          <slot v-if="step > 0" name="cancel" />
          <AppButton
            v-if="step < STEPS.length - 1"
            type="button"
            size="lg"
            class="!px-8"
            @click="next"
          >
            下一步 →
          </AppButton>
          <AppButton
            v-else
            type="submit"
            size="lg"
            class="!px-8"
            :disabled="submitting"
          >
            {{ submitting ? '保存中…' : (isEditMode ? '保存修改' : '开始记录人生 ✨') }}
          </AppButton>
        </div>
      </div>

      <p v-if="step === 2 && !isEditMode" class="mt-3 text-center text-xs text-gray-400">
        简介可以跳过，建档后随时在「个人档案」里补充
      </p>
    </form>
  </div>
</template>

<style scoped>
.min-h-44 {
  min-height: 11rem;
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>
