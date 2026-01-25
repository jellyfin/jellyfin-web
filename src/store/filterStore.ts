/**
 * Filter Store
 *
 * Zustand store for managing filter state across views.
 */

import { create } from 'zustand';

export interface FilterState {
    genres: string[];
    years: number[];
    studios: string[];
    artists: string[];
    genresMode: 'and' | 'or';
    isAdvancedFilter: boolean;

    // Actions
    setGenres: (genres: string[]) => void;
    toggleGenre: (genre: string) => void;
    setYears: (years: number[]) => void;
    toggleYear: (year: number) => void;
    setStudios: (studios: string[]) => void;
    toggleStudio: (studio: string) => void;
    setArtists: (artists: string[]) => void;
    toggleArtist: (artist: string) => void;
    setGenresMode: (mode: 'and' | 'or') => void;
    setAdvancedFilter: (isAdvanced: boolean) => void;
    clearFilters: () => void;
}

const initialState = {
    genres: [] as string[],
    years: [] as number[],
    studios: [] as string[],
    artists: [] as string[],
    genresMode: 'and' as 'and' | 'or',
    isAdvancedFilter: false
};

export const useFilterStore = create<FilterState>(set => ({
    ...initialState,

    setGenres: genres => set({ genres }),

    toggleGenre: genre =>
        set(state => ({
            genres: state.genres.includes(genre) ? state.genres.filter(g => g !== genre) : [...state.genres, genre]
        })),

    setYears: years => set({ years }),

    toggleYear: year =>
        set(state => ({
            years: state.years.includes(year) ? state.years.filter(y => y !== year) : [...state.years, year]
        })),

    setStudios: studios => set({ studios }),

    toggleStudio: studio =>
        set(state => ({
            studios: state.studios.includes(studio)
                ? state.studios.filter(s => s !== studio)
                : [...state.studios, studio]
        })),

    setArtists: artists => set({ artists }),

    toggleArtist: artist =>
        set(state => ({
            artists: state.artists.includes(artist)
                ? state.artists.filter(a => a !== artist)
                : [...state.artists, artist]
        })),

    setGenresMode: mode => set({ genresMode: mode }),

    setAdvancedFilter: isAdvanced => set({ isAdvancedFilter: isAdvanced }),

    clearFilters: () => set(initialState)
}));
