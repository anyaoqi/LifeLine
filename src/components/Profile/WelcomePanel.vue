<script setup lang="ts">
import { CalendarClock, Layers, Lock } from 'lucide-vue-next'
import ProfileEditor from '@/components/Profile/ProfileEditor.vue'

const highlights = [
  {
    icon: CalendarClock,
    title: '如实记录',
    text: '记不清的日期就写「2003年」,不伪造精度',
  },
  {
    icon: Layers,
    title: '大事小事分层',
    text: '里程碑清晰立传,日常小事不被淹没',
  },
  {
    icon: Lock,
    title: '本地存储',
    text: '数据只存在你的设备上,随时导出带走',
  },
]
</script>

<template>
  <section class="mx-auto w-full max-w-5xl animate-fade-in px-4 py-10 sm:px-6 lg:py-16">
    <div class="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
      <!-- 品牌陈述 -->
      <div class="text-center lg:text-left">
        <p class="text-xs font-medium tracking-[0.35em] text-app-accent">
          LIFEPOINT · 人生纪念册
        </p>
        <h1
          class="mt-5 font-display text-4xl font-bold leading-[1.35] text-app-ink sm:text-5xl sm:leading-[1.3]"
        >
          把人生里<br />
          值得记住的时刻,<br />
          <span class="text-app-accent">留在纸上。</span>
        </h1>
        <p class="mx-auto mt-6 max-w-md text-base leading-relaxed text-app-ink-soft lg:mx-0">
          一本只属于你的时间线:从出生到现在,
          大事清晰立传,小事温柔收好,随时回看。
        </p>

        <ul class="mx-auto mt-10 max-w-md space-y-4 text-left lg:mx-0">
          <li
            v-for="item in highlights"
            :key="item.title"
            class="flex items-start gap-3.5"
          >
            <span
              class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-app-accent-soft text-app-accent"
            >
              <component :is="item.icon" :size="17" :stroke-width="1.8" />
            </span>
            <div>
              <p class="text-sm font-semibold text-app-ink">{{ item.title }}</p>
              <p class="mt-0.5 text-sm text-app-ink-soft">{{ item.text }}</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- 建档表单 -->
      <div class="card-base rounded-2xl p-6 shadow-lg sm:p-8">
        <h2 class="font-display text-xl font-semibold text-app-ink">创建你的档案</h2>
        <p class="mb-6 mt-1 text-sm text-app-ink-faint">
          只需名字和生日,一分钟开始记录。
        </p>
        <ProfileEditor />
      </div>
    </div>
  </section>
</template>
