import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../../../hooks/useApi';
import { addSection, getCardOptionsFromType, getItemTypesFromCollectionType, getTitleFromType, isLivetv, isMovies, isMusic, isTVShows, sortSections } from '../utils/search';
import { Section } from '../types';
import { fetchItemsByType } from './fetchItemsByType';
import { LIVETV_CARD_OPTIONS } from '../constants/liveTvCardOptions';

export const useSearchItems = (
    parentId?: string,
    collectionType?: CollectionType,
    searchTerm?: string
) => {
    const { api, user } = useApi();
    const userId = user?.Id;

    return useQuery({
        queryKey: ['Search', 'Items', collectionType, parentId, searchTerm],
        queryFn: async ({ signal }) => {
            // Handle LiveTV collection type separately
            if (collectionType && isLivetv(collectionType)) {
                // For LiveTV, use specialized search logic
                const liveTvData = await fetchItemsByType(api!, userId, {
                    includeItemTypes: [BaseItemKind.LiveTvProgram, BaseItemKind.LiveTvChannel],
                    parentId,
                    searchTerm,
                    limit: 200
                }, { signal });

                const sections: Section[] = [];
                if (liveTvData.Items) {
                    const programs = liveTvData.Items.filter(item => item.Type === BaseItemKind.LiveTvProgram);
                    const channels = liveTvData.Items.filter(item => item.Type === BaseItemKind.LiveTvChannel);
                    
                    addSection(sections, 'Programs', programs, { ...LIVETV_CARD_OPTIONS });
                    addSection(sections, 'Channels', channels, { ...LIVETV_CARD_OPTIONS });
                }
                return sortSections(sections);
            }

            const sections: Section[] = [];

            // Optimize search by making parallel requests instead of sequential ones
            const searchPromises: Promise<any>[] = [];

            // Only fetch relevant data based on collection type
            if (!collectionType || isMusic(collectionType)) {
                searchPromises.push(
                    fetchItemsByType(api!, userId, {
                        includeItemTypes: [BaseItemKind.MusicArtist],
                        parentId,
                        searchTerm,
                        limit: 100
                    }, { signal }).then(data => ({
                        type: 'Artists',
                        items: data.Items,
                        options: { coverImage: true }
                    }))
                );
            }

            if (!collectionType || isMovies(collectionType) || isTVShows(collectionType)) {
                searchPromises.push(
                    fetchItemsByType(api!, userId, {
                        includeItemTypes: [BaseItemKind.Person],
                        parentId,
                        searchTerm,
                        limit: 100
                    }, { signal }).then(data => ({
                        type: 'People',
                        items: data.Items,
                        options: { coverImage: true }
                    }))
                );
            }

            // Add programs search for LiveTV content
            if (!collectionType) {
                searchPromises.push(
                    fetchItemsByType(api!, userId, {
                        includeItemTypes: [BaseItemKind.LiveTvProgram],
                        parentId,
                        searchTerm,
                        limit: 100
                    }, { signal }).then(data => ({
                        type: 'Programs',
                        items: data.Items,
                        options: { ...LIVETV_CARD_OPTIONS }
                    }))
                );
            }

            // Main content search - optimized single query
            const itemTypes: BaseItemKind[] = getItemTypesFromCollectionType(collectionType);
            if (itemTypes.length > 0) {
                searchPromises.push(
                    fetchItemsByType(api!, userId, {
                        includeItemTypes: itemTypes,
                        parentId,
                        searchTerm,
                        limit: 800
                    }, { signal }).then(data => ({
                        type: 'MainContent',
                        data: data
                    }))
                );
            }

            // Execute all searches in parallel for better performance
            const results = await Promise.all(searchPromises);

            // Process results
            for (const result of results) {
                if (result.type === 'MainContent' && result.data.Items) {
                    // Group items by type
                    const itemsByType = new Map<BaseItemKind, BaseItemDto[]>();
                    
                    for (const item of result.data.Items) {
                        if (!itemsByType.has(item.Type!)) {
                            itemsByType.set(item.Type!, []);
                        }
                        itemsByType.get(item.Type!)!.push(item);
                    }

                    // Add sections for each item type
                    for (const [itemType, items] of itemsByType) {
                        addSection(sections, getTitleFromType(itemType), items, getCardOptionsFromType(itemType));
                    }
                } else if (result.items) {
                    addSection(sections, result.type, result.items, result.options);
                }
            }

            return sortSections(sections);
        },
        enabled: !!api && !!userId && !!searchTerm?.trim()
    });
};
