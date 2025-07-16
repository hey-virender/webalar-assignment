import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { disconnectSocket } from "../lib/socket";

// Custom storage implementation with mobile compatibility
const createMobileCompatibleStorage = () => {
  // Check if localStorage is available
  const isStorageAvailable = () => {
    try {
      const testKey = "__zustand_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn("localStorage not available:", error);
      return false;
    }
  };

  // Fallback storage for when localStorage is not available
  const memoryStorage = {
    data: {},
    getItem: (key) => memoryStorage.data[key] || null,
    setItem: (key, value) => {
      memoryStorage.data[key] = value;
    },
    removeItem: (key) => {
      delete memoryStorage.data[key];
    },
    clear: () => {
      memoryStorage.data = {};
    },
  };

  return {
    getItem: (name) => {
      try {
        if (isStorageAvailable()) {
          return localStorage.getItem(name);
        } else {
          return memoryStorage.getItem(name);
        }
      } catch (error) {
        console.warn("Error getting item from storage:", error);
        return memoryStorage.getItem(name);
      }
    },
    setItem: (name, value) => {
      try {
        if (isStorageAvailable()) {
          localStorage.setItem(name, value);
        } else {
          memoryStorage.setItem(name, value);
        }
      } catch (error) {
        console.warn("Error setting item in storage:", error);
        memoryStorage.setItem(name, value);
      }
    },
    removeItem: (name) => {
      try {
        if (isStorageAvailable()) {
          localStorage.removeItem(name);
        } else {
          memoryStorage.removeItem(name);
        }
      } catch (error) {
        console.warn("Error removing item from storage:", error);
        memoryStorage.removeItem(name);
      }
    },
  };
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      isHydrated: false,

      // Set hydration state
      setHydrated: () => set({ isHydrated: true }),

      login: (user, token) => {
        try {
          set({
            isAuthenticated: true,
            user: user,
            token: token,
          });
        } catch (error) {
          console.error("Error during login:", error);
        }
      },

      updateUser: (user) => {
        try {
          set({ user });
        } catch (error) {
          console.error("Error updating user:", error);
        }
      },

      logout: () => {
        try {
          // Disconnect socket before clearing auth state
          disconnectSocket();

          set({
            isAuthenticated: false,
            user: null,
            token: null,
          });
        } catch (error) {
          console.error("Error during logout:", error);
          // Force state reset even if storage fails
          set({
            isAuthenticated: false,
            user: null,
            token: null,
          });
        }
      },

      // Helper to check if store is ready (hydrated)
      isReady: () => get().isHydrated,
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => createMobileCompatibleStorage()),

      // Handle rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated();
        }
      },

      // Partial state for what gets persisted
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
      }),

      // Version for migration if needed
      version: 1,

      // Migration function for future updates
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migration logic for older versions
          return persistedState;
        }
        return persistedState;
      },
    },
  ),
);

// Initialize hydration in browser environment
if (typeof window !== "undefined") {
  useAuthStore.persist.rehydrate();
}

export default useAuthStore;
