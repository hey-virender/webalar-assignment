import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
const useAuthStore = create(persist((set) => ({
  isAuthenticated: false,
  user: null,
  login: (user) => {
    set({ isAuthenticated: true, user: user });
  },
  updateUser: (user) => {
    set({ user });
  },
  logout: () => {
    set({ isAuthenticated: false, user: null });
  },
}),{
  name: "auth-store",
  storage: createJSONStorage(() => localStorage),
}));
export default useAuthStore;
