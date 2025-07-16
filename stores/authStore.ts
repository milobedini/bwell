// stores/useAuthStore.ts
import { create } from 'zustand';
import { persist, type StorageValue } from 'zustand/middleware';
import type { AuthUser } from '@milobedini/shared-types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthState = {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null })
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: async (key): Promise<StorageValue<AuthState> | null> => {
          const value = await AsyncStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (key, value) => {
          await AsyncStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: async (key) => {
          await AsyncStorage.removeItem(key);
        }
      }
    }
  )
);
