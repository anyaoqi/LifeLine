<script setup lang="ts">
import { computed, ref } from 'vue'
import { GraduationCap, Briefcase, Heart, House, Check } from 'lucide-vue-next'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { LIFE_TEMPLATES, previewTemplate, type LifeTemplate } from '@/utils/lifeTemplates'
import { useEventStore } from '@/stores/eventStore'
import { useUserStore } from '@/stores/userStore'
import { useToast } from '@/composables/useToast'

/**
 * 人生模板选择器:一键按学制/职业等生成阶段草稿,
 * 解决冷启动手打 20 条的阻力。草稿在时间线上以虚线卡片呈现。
 */
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const eventStore = useEventStore()
const userStore = useUserStore()
const toast = useToast()

const templates = LIFE_TEMPLATES
const applied = ref<Set<string>>(new Set())

const icons = {
  graduation: GraduationCap,
  briefcase: Briefcase,
  heart: Heart,
  home: House,
} as const

function preview(t: LifeTemplate) {
  return previewTemplate(t, userStore.user?.birthDate).slice(0, 4)
}

const canApply = computed(() => !!userStore.user?.birthDate)

function close() {
  emit('update:modelValue', false)
  emit('close')
}

async function apply(template: LifeTemplate) {
  if (!canApply) return
  try {
    const { buildDraftEvents } = await import('@/utils/lifeTemplates')
    const n = await eventStore.createDrafts(buildDraftEvents(template, userStore.user?.birthDate))
    applied.value.add(template.key)
    toast.success(`已生成 ${n} 条草稿,去时间线逐条确认吧`)
  } catch {
    toast.error('生成草稿失败,请重试')
  }
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    title="从人生模板开始"
    max-width="max-w-2xl"
    @update:model-value="(v: boolean) => { if (!v) close() }"
    @close="close"
  >
    <p class="mb-5 text-sm leading-relaxed text-app-ink-soft">
      选择一段人生经历,自动铺好时间线骨架(按你的出生年份推算)。
      生成的记录以<span class="font-medium text-app-accent">草稿</span>呈现,确认或修改后才算数。
    </p>

    <div class="grid gap-3 sm:grid-cols-2">
      <div
        v-for="t in templates"
        :key="t.key"
        class="rounded-xl border p-4 transition-all"
        :class="applied.has(t.key)
          ? 'border-app-accent/50 bg-app-accent-soft/50'
          : 'border-app-border hover:border-app-border-strong hover:shadow-sm'"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-app-bg-deep text-app-accent">
              <component :is="icons[t.icon]" :size="18" :stroke-width="1.7" />
            </span>
            <div>
              <h3 class="font-display text-base font-semibold text-app-ink">{{ t.name }}</h3>
              <p class="text-xs text-app-ink-faint">{{ t.tagline }}</p>
            </div>
          </div>
          <Check v-if="applied.has(t.key)" :size="16" class="mt-1 text-app-accent" />
        </div>

        <ul class="mt-3 space-y-1">
          <li
            v-for="p in preview(t)"
            :key="p.title"
            class="flex items-baseline gap-2 text-xs text-app-ink-soft"
          >
            <span class="font-display font-semibold text-app-ink-faint">{{ p.year }}</span>
            <span>{{ p.title }}</span>
          </li>
          <li v-if="t.items.length > 4" class="pl-0 text-xs text-app-ink-faint">
            …共 {{ t.items.length }} 条
          </li>
        </ul>

        <AppButton
          size="sm"
          :variant="applied.has(t.key) ? 'secondary' : 'primary'"
          class="mt-3.5"
          block
          :disabled="!canApply"
          @click="apply(t)"
        >
          {{ applied.has(t.key) ? '再次生成' : '一键铺底' }}
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>
