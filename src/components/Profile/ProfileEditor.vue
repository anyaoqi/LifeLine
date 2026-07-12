<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import { useUserStore } from '@/stores/userStore'
import { validateProfile } from '@/utils/validators'
import { toDateInputValue, fromDateInputValue } from '@/utils/dateUtils'
import type { UserProfile } from '@/types'

interface Props {
  // 传入则为编辑模式，不传为创建模式
  existing?: UserProfile | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ saved: [user: UserProfile] }>()

const userStore = useUserStore()

const form = reactive({
  name: '',
  birthDate: '',
  bio: '',
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)

// 初始化表单数据
watch(
  () => props.existing,
  (user) => {
    if (user) {
      form.name = user.name
      form.birthDate = toDateInputValue(user.birthDate)
      form.bio = user.bio ?? ''
    }
  },
  { immediate: true }
)

async function handleSubmit() {
  const input = {
    name: form.name.trim(),
    birthDate: fromDateInputValue(form.birthDate),
    bio: form.bio.trim() || undefined,
  }
  const result = validateProfile(input)
  errors.value = result.errors
  if (!result.valid) return

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
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <!-- 姓名 -->
    <div>
      <label for="profile-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        姓名 <span class="text-red-500">*</span>
      </label>
      <input
        id="profile-name"
        v-model.trim="form.name"
        type="text"
        maxlength="30"
        class="input-base"
        placeholder="你的名字"
        :class="{ '!border-red-400 !ring-red-400': errors.name }"
      />
      <p v-if="errors.name" class="mt-1 text-sm text-red-500">{{ errors.name }}</p>
    </div>

    <!-- 出生日期 -->
    <div>
      <label for="profile-birth" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        出生日期 <span class="text-red-500">*</span>
      </label>
      <input
        id="profile-birth"
        v-model="form.birthDate"
        type="date"
        class="input-base"
        :class="{ '!border-red-400 !ring-red-400': errors.birthDate }"
      />
      <p v-if="errors.birthDate" class="mt-1 text-sm text-red-500">{{ errors.birthDate }}</p>
    </div>

    <!-- 简介 -->
    <div>
      <label for="profile-bio" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        个人简介
      </label>
      <textarea
        id="profile-bio"
        v-model="form.bio"
        rows="3"
        maxlength="200"
        class="input-base resize-none"
        placeholder="简单介绍一下自己（选填）"
      ></textarea>
      <p class="mt-1 text-xs text-gray-400 text-right">{{ form.bio.length }} / 200</p>
      <p v-if="errors.bio" class="mt-1 text-sm text-red-500">{{ errors.bio }}</p>
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <slot name="cancel" />
      <AppButton type="submit" :disabled="submitting">
        {{ submitting ? '保存中…' : (existing ? '保存修改' : '创建档案') }}
      </AppButton>
    </div>
  </form>
</template>
