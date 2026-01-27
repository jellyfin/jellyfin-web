/**
 * Items API Layer
 *
 * Type-safe API wrapper for Jellyfin items endpoints.
 * Uses TanStack Query for caching and state management.
 */

import type {
    BaseItemDto,
    BaseItemDtoQueryResult,
    UserItemDataDto
} from '@jellyfin/sdk/lib/generated-client';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import { useConnectionStore } from '../../store/connectionStore';
import { type ItemsQueryOptions, queryKeys } from '../queryKeys';

// Get the current ApiClient
const getApiClient = () => {
    // First try to get from modern connection store
    const store = useConnectionStore.getState();
    if (store.currentApiClient) {
        return store.currentApiClient;
    }

    // Fallback to legacy ServerConnections for backward compatibility
    const apiClient = ServerConnections.currentApiClient();
    if (!apiClient) {
        throw new Error('[ItemsAPI] No API connection available');
    }
    return apiClient;
};

// Get the current user ID
const getUserId = () => {
    const apiClient = getApiClient();
    const userId = apiClient.getCurrentUserId();

    // Ensure userId is a string, not an object
    if (typeof userId !== 'string' || !userId) {
        // Try fallback from connection store
        const store = useConnectionStore.getState();
        if (store.currentUserId) {
            return store.currentUserId;
        }
        throw new Error('[ItemsAPI] Unable to determine current user ID');
    }
    return userId;
};

export const itemsApi = {
    /**
     * Get items by various criteria
     */
    getItems: async (
        parentId: string,
        options?: ItemsQueryOptions
    ): Promise<BaseItemDtoQueryResult> => {
        const apiClient = getApiClient();
        const userId = getUserId();

        return apiClient.getItems(userId, {
            ParentId: parentId || undefined,
            StartIndex: options?.startIndex,
            Limit: options?.limit,
            Recursive: options?.recursive ?? true,
            SortBy: options?.sortBy,
            SortOrder: options?.sortOrder,
            Filters: options?.filters as string[] | undefined,
            SearchTerm: options?.searchTerm,
            IncludeItemTypes: options?.includeTypes as string[] | undefined,
            ImageTypeLimit: options?.imageTypeLimit,
            EnableImages: options?.imageTypeLimit ? true : undefined,
            EnableUserData: true
        });
    },

    /**
     * Get a single item by ID
     */
    getItem: async (id: string): Promise<BaseItemDto> => {
        const apiClient = getApiClient();
        const userId = getUserId();
        return apiClient.getItem(userId, id);
    },

    /**
     * Get user views (library folders)
     */
    getUserViews: async (): Promise<BaseItemDto[]> => {
        const apiClient = getApiClient();
        const userId = getUserId();

        return (apiClient as any)
            .getUserViews(userId, {
                EnableUserData: true,
                EnableImages: true
            })
            .then((r: any) => r.Items);
    },

    /**
     * Get genres for a type
     */
    getGenres: async (type: string, parentId?: string): Promise<BaseItemDto[]> => {
        const apiClient = getApiClient();
        const userId = getUserId();

        return (apiClient as any)
            .getGenres(userId, {
                IncludeItemTypes: type,
                ParentId: parentId,
                EnableUserData: true,
                EnableImages: true
            })
            .then((r: any) => r.Items);
    },

    /**
     * Get artists
     */
    getArtists: async (params?: {
        parentId?: string;
        searchTerm?: string;
        startIndex?: number;
        limit?: number;
        recursive?: boolean;
        sortBy?: string;
        sortOrder?: 'Ascending' | 'Descending';
    }): Promise<BaseItemDtoQueryResult> => {
        const apiClient = getApiClient();
        const userId = getUserId();

        return apiClient.getArtists(userId, {
            ParentId: params?.parentId,
            StartIndex: params?.startIndex,
            Limit: params?.limit,
            Recursive: params?.recursive ?? true,
            SortBy: params?.sortBy,
            SortOrder: params?.sortOrder,
            SearchTerm: params?.searchTerm,
            EnableUserData: true,
            EnableImages: true
        });
    },

    /**
     * Get artist by ID
     */
    getArtist: async (id: string): Promise<BaseItemDto> => {
        const apiClient = getApiClient();
        const userId = getUserId();

        return apiClient.getItem(userId, id);
    },

    /**
     * Get episodes
     */
    getEpisodes: async (
        seriesId: string,
        options?: {
            seasonId?: string;
            startIndex?: number;
            limit?: number;
            recursive?: boolean;
            sortBy?: string;
            sortOrder?: 'Ascending' | 'Descending';
        }
    ): Promise<BaseItemDtoQueryResult> => {
        const apiClient = getApiClient();

        return apiClient.getEpisodes(seriesId, {
            SeasonId: options?.seasonId,
            StartIndex: options?.startIndex,
            Limit: options?.limit,
            Recursive: options?.recursive ?? true,
            SortBy: options?.sortBy,
            SortOrder: options?.sortOrder,
            EnableUserData: true,
            EnableImages: true
        });
    },

    /**
     * Get seasons for a series
     */
    getSeasons: async (seriesId: string): Promise<BaseItemDto[]> => {
        const apiClient = getApiClient();

        return (apiClient as any)
            .getSeasons(seriesId, {
                EnableUserData: true,
                EnableImages: true
            })
            .then((r: any) => r.Items);
    },

    /**
     * Get user favorite items
     */
    getUserFavorites: async (): Promise<BaseItemDtoQueryResult> => {
        const apiClient = getApiClient();
        const userId = getUserId();

        return apiClient.getItems(userId, {
            Filters: ['IsFavorite'],
            Recursive: true,
            Limit: 100,
            EnableUserData: true,
            EnableImages: true
        });
    },

    /**
     * Toggle favorite status
     */
    toggleFavorite: async (itemId: string, isFavorite: boolean): Promise<UserItemDataDto> => {
        const apiClient = getApiClient();
        const userId = getUserId();

        return apiClient.updateFavoriteStatus(userId, itemId, isFavorite);
    }
};

// For convenience, export getItems as a standalone function
export const getItems = itemsApi.getItems;

// Export query keys for convenience
export { queryKeys };
