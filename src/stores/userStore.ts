import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserProfile } from '@/types';
import { userService, eventService, storageUtils } from '@/services/storageService';

export const useUserStore = defineStore('user', () => {
  const user = ref<UserProfile | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const isLoggedIn = computed(() => !!user.value);
  const userId = computed(() => user.value?.id || '');
  const userName = computed(() => user.value?.name || '');
  const userAge = computed(() => {
    if (!user.value) return 0;
    const birthDate = new Date(user.value.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  });

  // 初始化用户
  async function initUser() {
    loading.value = true;
    error.value = null;
    try {
      const userId = storageUtils.getCurrentUserId();
      if (userId) {
        const userData = await userService.getUser(userId);
        if (userData) {
          user.value = userData;
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load user';
    } finally {
      loading.value = false;
    }
  }

  // 创建用户档案
  async function createUser(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true;
    error.value = null;
    try {
      const now = new Date().toISOString();
      const newUser: UserProfile = {
        ...profile,
        id: eventService.generateId(),
        createdAt: now,
        updatedAt: now,
      };
      await userService.saveUser(newUser);
      user.value = newUser;
      storageUtils.setCurrentUserId(newUser.id);
      return newUser;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create user';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 更新用户档案
  async function updateUser(updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) {
    if (!user.value) return;
    loading.value = true;
    error.value = null;
    try {
      const updatedUser: UserProfile = {
        ...user.value,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await userService.saveUser(updatedUser);
      user.value = updatedUser;
      return updatedUser;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update user';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 登出（清除当前用户）
  function logout() {
    user.value = null;
    storageUtils.setCurrentUserId('');
  }

  return {
    // State
    user,
    loading,
    error,
    // Computed
    isLoggedIn,
    userId,
    userName,
    userAge,
    // Methods
    initUser,
    createUser,
    updateUser,
    logout,
  };
});
