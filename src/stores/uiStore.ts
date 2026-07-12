import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Theme } from '@/types';
import { storageUtils } from '@/services/storageService';

const THEME_STORAGE_KEY = 'life-point-theme';

export const useUiStore = defineStore('ui', () => {
  const theme = ref<Theme>('auto');
  // 系统当前实际是深色还是浅色（用于 auto 模式）
  const systemDark = ref(false);
  let mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

  // 最终是否应用深色模式
  const isDark = computed(() => {
    if (theme.value === 'auto') return systemDark.value;
    return theme.value === 'dark';
  });

  // 主题循环：light -> dark -> auto -> light（用于 Header 切换按钮）
  const themeCycle: Theme[] = ['light', 'dark', 'auto'];

  // 设置主题并持久化 + 应用到 DOM
  function setTheme(next: Theme) {
    theme.value = next;
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme();
  }

  // 循环切换主题
  function cycleTheme() {
    const idx = themeCycle.indexOf(theme.value);
    const next = themeCycle[(idx + 1) % themeCycle.length];
    setTheme(next);
  }

  // 应用 isDark 到 <html> 的 class
  function applyTheme() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (isDark.value) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.colorScheme = isDark.value ? 'dark' : 'light';
  }

  // 初始化：读取偏好、监听系统变化、应用到 DOM
  function initTheme() {
    // 读取用户偏好
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    theme.value = saved ?? 'auto';

    // 读取系统偏好
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      systemDark.value = mq.matches;

      // 防止重复绑定（HMR 场景下 initTheme 可能被多次调用）
      if (mediaListener) {
        mq.removeEventListener('change', mediaListener);
      }
      mediaListener = (e: MediaQueryListEvent) => {
        systemDark.value = e.matches;
        applyTheme();
      };
      mq.addEventListener('change', mediaListener);
    }

    applyTheme();
  }

  // 统一清理本地数据
  function clearLocalData() {
    storageUtils.clearAll();
  }

  return {
    theme,
    systemDark,
    isDark,
    setTheme,
    cycleTheme,
    initTheme,
    applyTheme,
    clearLocalData,
  };
});
