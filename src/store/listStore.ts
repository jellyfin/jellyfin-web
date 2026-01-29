/**
 * List Store
 *
 * Zustand store for managing list view state.
 */

import { create } from 'zustand';

export type ViewMode = 'grid' | 'list';

export interface ListState {
    viewMode: ViewMode;
    parentId: string | null;
    collectionType: string | null;
    sortBy: string;
    sortOrder: 'Ascending' | 'Descending';
    isLoading: boolean;
    error: string | null;

    // Actions
    setViewMode: (mode: ViewMode) => void;
    setParentId: (id: string | null) => void;
    setCollectionType: (type: string | null) => void;
    setSort: (by: string, order: 'Ascending' | 'Descending') => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

const initialState = {
    viewMode: 'grid' as ViewMode,
    parentId: null as string | null,
    collectionType: null as string | null,
    sortBy: 'Name',
    sortOrder: 'Ascending' as 'Ascending' | 'Descending',
    isLoading: false,
    error: null as string | null
};

export const useListStore = create<ListState>((set) => ({
    ...initialState,

    setViewMode: (mode) => set({ viewMode: mode }),

    setParentId: (id) => set({ parentId: id }),

    setCollectionType: (type) => set({ collectionType: type }),

    setSort: (by, order) => set({ sortBy: by, sortOrder: order }),

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),

    reset: () => set(initialState)
}));
