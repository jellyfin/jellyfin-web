/**
 * Auth Store
 *
 * Zustand store for managing authentication state.
 */

import { create } from 'zustand';

export interface User {
    id: string;
    username: string;
    serverId: string;
    accessToken: string;
    isLoggedIn: boolean;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    login: (user: User) => void;
    logout: () => void;
    clearError: () => void;
}

const initialState = {
    user: null as User | null,
    isAuthenticated: false,
    isLoading: false,
    error: null as string | null,
};

export const useAuthStore = create<AuthState>((set) => ({
    ...initialState,

    setUser: (user) => set({ user, isAuthenticated: !!user }),

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),

    login: (user) => set({ user, isAuthenticated: true, error: null }),

    logout: () => set(initialState),

    clearError: () => set({ error: null }),
}));
