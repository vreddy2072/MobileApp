import { create } from 'zustand';

/**
 * Store for auth state so services (outside React) can read userId and accessToken.
 * Updated by App auth subscription when session changes.
 */
interface AuthStore {
  userId: string | null;
  accessToken: string | null;
  setAuth: (userId: string | null, accessToken: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  userId: null,
  accessToken: null,
  setAuth: (userId, accessToken) => set({ userId, accessToken }),
}));
