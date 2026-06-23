"use client";

import { create } from "zustand";
import type { UserProfile } from "@repo/shared-types";

interface AuthState {
  /** The authenticated user's profile — null when not logged in. */
  user: UserProfile | null;
  /** True while a session check or profile fetch is in progress. */
  loading: boolean;
  /** Set the initial user (called on mount from a session check). */
  setUser: (user: UserProfile | null) => void;
  /** Set loading state. */
  setLoading: (loading: boolean) => void;
  /** Clear user on logout. */
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  clearUser: () => set({ user: null, loading: false }),
}));