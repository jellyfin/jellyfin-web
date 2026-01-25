/**
 * Sort Store
 *
 * Zustand store for managing sort preferences.
 */

import { create } from 'zustand';

export type SortOrder = 'Ascending' | 'Descending';

export interface SortOption {
    value: string;
    label: string;
}

export interface SortState {
    sortBy: string;
    sortOrder: SortOrder;
    availableSorts: SortOption[];

    // Actions
    setSortBy: (by: string) => void;
    setSortOrder: (order: SortOrder) => void;
    toggleSortOrder: () => void;
    setAvailableSorts: (sorts: SortOption[]) => void;
    reset: () => void;
}

const SORT_OPTIONS: SortOption[] = [
    { value: 'Name', label: 'Name' },
    { value: 'SortName', label: 'Sort Name' },
    { value: 'PremiereDate', label: 'Premiere Date' },
    { value: 'DateCreated', label: 'Date Added' },
    { value: 'PlayCount', label: 'Play Count' },
    { value: 'CommunityRating', label: 'Rating' },
    { value: 'Runtime', label: 'Runtime' },
];

const initialState = {
    sortBy: 'Name',
    sortOrder: 'Ascending' as SortOrder,
    availableSorts: SORT_OPTIONS,
};

export const useSortStore = create<SortState>((set) => ({
    ...initialState,

    setSortBy: (by) => set({ sortBy: by }),

    setSortOrder: (order) => set({ sortOrder: order }),

    toggleSortOrder: () => set((state) => ({
        sortOrder: state.sortOrder === 'Ascending' ? 'Descending' : 'Ascending',
    })),

    setAvailableSorts: (sorts) => set({ availableSorts: sorts }),

    reset: () => set(initialState),
}));
