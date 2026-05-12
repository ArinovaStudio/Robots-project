import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  role?: "USER" | "ADMIN";
  isVerified?: boolean;
}

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;

  setUser: (user: User) => void;
  clearUser: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      clearUser: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),

      updateUser: (data) =>
        set({
          user: get().user
            ? { ...get().user!, ...data }
            : null,
        }),
    }),
    {
      name: "user-store",
    }
  )
);