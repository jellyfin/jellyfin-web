/**
 * Book Store
 *
 * Manages reading progress and state for books, PDFs and comics.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { logger } from '../utils/logger';

export interface BookState {
    currentItemId: string | null;
    currentPage: number;
    totalPages: number;
    isLoaded: boolean;
    fontSize: string;
    theme: 'dark' | 'sepia' | 'light';
}

export interface BookActions {
    setCurrentBook: (itemId: string, totalPages: number) => void;
    setPage: (page: number) => void;
    setTotalPages: (total: number) => void;
    setLoaded: (loaded: boolean) => void;
    setFontSize: (size: string) => void;
    setTheme: (theme: BookState['theme']) => void;
    reset: () => void;
}

export const useBookStore = create<BookState & BookActions>()(
    subscribeWithSelector(set => ({
        currentItemId: null,
        currentPage: 1,
        totalPages: 0,
        isLoaded: false,
        fontSize: 'medium',
        theme: 'dark',

        setCurrentBook: (itemId, totalPages) => {
            set({
                currentItemId: itemId,
                totalPages,
                currentPage: 1,
                isLoaded: false
            });
            logger.info('Book selected', { component: 'BookStore', itemId });
        },

        setPage: currentPage => set({ currentPage }),

        setTotalPages: totalPages => set({ totalPages }),

        setLoaded: isLoaded => set({ isLoaded }),

        setFontSize: fontSize => set({ fontSize }),

        setTheme: theme => set({ theme }),

        reset: () =>
            set({
                currentItemId: null,
                currentPage: 1,
                totalPages: 0,
                isLoaded: false
            })
    }))
);
