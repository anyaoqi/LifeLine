import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Theme } from '@/types';
import { storageUtils } from '@/services/storageService';

const THEME_STORAGE_KEY = 'life-point-theme';

export const useUiStore = defineStore('ui', () => {
  const theme = ref<Theme>('light');
  // 全局事件表单弹窗状态：任何页面均可直接打开，保存后跳转时间线。
  const showEventForm = ref(false);

  // 最终是否应用深色模式（只有浅色 / 深色两态）
  const isDark = computed(() => theme.value === 'dark');

  // 设置主题并持久化 + 应用到 DOM
  function setTheme(next: Theme) {
    theme.value = next;
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme();
  }

  // 浅色 <-> 深色直接切换（用于 Header 切换按钮）
  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark');
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

  // 初始化：读取偏好并应用到 DOM（只有浅色 / 深色两态；
  // 老数据若存的是 'auto' 则迁移为浅色）
  function initTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    theme.value = saved === 'dark' ? 'dark' : 'light';
    applyTheme();
  }

  // 打开全局新增事件弹窗
  function openEventForm() {
    showEventForm.value = true;
  }

  // 关闭全局新增事件弹窗
  function closeEventForm() {
    showEventForm.value = false;
  }

  // 统一清理本地数据
  function clearLocalData() {
    storageUtils.clearAll();
  }

  return {
    theme,
    showEventForm,
    isDark,
    setTheme,
    toggleTheme,
    initTheme,
    applyTheme,
    openEventForm,
    closeEventForm,
    clearLocalData,
  };
});
