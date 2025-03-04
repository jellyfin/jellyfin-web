import type { AxiosRequestConfig } from 'axios';
import type { Api } from '@jellyfin/sdk';
import type {
    BaseItemDto,
    ItemsApiGetItemsRequest
} from '@jellyfin/sdk/lib/generated-client';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../../../hooks/useApi';
import type { CardOptions } from 'types/cardOptions';
import { CardShape } from 'utils/card';
import { addSection, getCardOptionsFromType, getItemTypesFromCollectionType, getTitleFromType, isLivetv, isMovies, isMusic, isTVShows } from '../utils/search';
import { useArtistsSearch } from './useArtistsSearch';
import { usePeopleSearch } from './usePeopleSearch';
import { useVideoSearch } from './useVideoSearch';
import { QUERY_OPTIONS } from '../constants/queryOptions';
import { Section } from '../types';

const fetchItemsByType = async (
    api: Api,
    userId?: string,
    params?: ItemsApiGetItemsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getItemsApi(api).getItems(
        {
            ...QUERY_OPTIONS,
            userId: userId,
            recursive: true,
            ...params
        },
        options
    );
    return response.data;
};

const LIVETV_CARD_OPTIONS = {
    preferThumb: true,
    inheritThumb: false,
    showParentTitleOrTitle: true,
    showTitle: false,
    coverImage: true,
    overlayMoreButton: true,
    showAirTime: true,
    showAirDateTime: true,
    showChannelName: true
};

type AddSectionFunction = (
    title: string,
    items: BaseItemDto[] | null | undefined,
    cardOptions?: CardOptions
) => void;

const fetchLiveTv = async (api: Api, userId: string | undefined, searchTerm: string | undefined, signal: AbortSignal, addSection: AddSectionFunction) => {
    // Movies row
    const moviesData = await fetchItemsByType(
        api,
        userId,
        {
            includeItemTypes: [BaseItemKind.LiveTvProgram],
            isMovie: true,
            searchTerm: searchTerm
        },
        { signal }
    );
    addSection('Movies', moviesData.Items, {
        ...LIVETV_CARD_OPTIONS,
        shape: CardShape.PortraitOverflow
    });

    // Episodes row
    const episodesData = await fetchItemsByType(
        api,
        userId,
        {
            includeItemTypes: [BaseItemKind.LiveTvProgram],
            isMovie: false,
            isSeries: true,
            isSports: false,
            isKids: false,
            isNews: false,
            searchTerm: searchTerm
        },
        { signal }
    );
    addSection('Episodes', episodesData.Items, {
        ...LIVETV_CARD_OPTIONS
    });

    // Sports row
    const sportsData = await fetchItemsByType(
        api,
        userId,
        {
            includeItemTypes: [BaseItemKind.LiveTvProgram],
            isSports: true,
            searchTerm: searchTerm
        },
        { signal }
    );
    addSection('Sports', sportsData.Items, {
        ...LIVETV_CARD_OPTIONS
    });

    // Kids row
    const kidsData = await fetchItemsByType(
        api,
        userId,
        {
            includeItemTypes: [BaseItemKind.LiveTvProgram],
            isKids: true,
            searchTerm: searchTerm
        },
        { signal }
    );
    addSection('Kids', kidsData.Items, {
        ...LIVETV_CARD_OPTIONS
    });

    // News row
    const newsData = await fetchItemsByType(
        api,
        userId,
        {
            includeItemTypes: [BaseItemKind.LiveTvProgram],
            isNews: true,
            searchTerm: searchTerm
        },
        { signal }
    );
    addSection('News', newsData.Items, {
        ...LIVETV_CARD_OPTIONS
    });

    // Programs row
    const programsData = await fetchItemsByType(
        api,
        userId,
        {
            includeItemTypes: [BaseItemKind.LiveTvProgram],
            isMovie: false,
            isSeries: false,
            isSports: false,
            isKids: false,
            isNews: false,
            searchTerm: searchTerm
        },
        { signal }
    );
    addSection('Programs', programsData.Items, {
        ...LIVETV_CARD_OPTIONS
    });

    // Channels row
    const channelsData = await fetchItemsByType(
        api,
        userId,
        {
            includeItemTypes: [BaseItemKind.TvChannel],
            searchTerm: searchTerm
        },
        { signal }
    );
    addSection('Channels', channelsData.Items);
};

export const useSearchItems = (
    parentId?: string,
    collectionType?: CollectionType,
    searchTerm?: string
) => {
    const { data: artists, isPending: isArtistsPending } = useArtistsSearch(parentId, collectionType, searchTerm);
    const { data: people, isPending: isPeoplePending } = usePeopleSearch(parentId, collectionType, searchTerm);
    const { data: videos, isPending: isVideosPending } = useVideoSearch(parentId, collectionType, searchTerm);
    const { api, user } = useApi();
    const userId = user?.Id;

    const isArtistsEnabled = !isArtistsPending || (collectionType && !isMusic(collectionType));
    const isPeopleEnabled = !isPeoplePending || (collectionType && !isMovies(collectionType) && !isTVShows(collectionType));
    const isVideosEnabled = !isVideosPending || collectionType;

    return useQuery({
        queryKey: ['SearchItems', collectionType, parentId, searchTerm],
        queryFn: async ({ signal }) => {
            if (!api) throw new Error('No API instance available');
            if (!userId) throw new Error('No User ID provided');

            const sections: Section[] = [];

            addSection(sections, 'Artists', artists?.Items, {
                coverImage: true
            });

            addSection(sections, 'People', people?.Items, {
                coverImage: true
            });

            addSection(sections, 'HeaderVideos', videos?.Items, {
                showParentTitle: true
            });

            const itemTypes = getItemTypesFromCollectionType(collectionType);

            const searchData = await fetchItemsByType(
                api,
                userId,
                {
                    includeItemTypes: itemTypes,
                    parentId: parentId,
                    searchTerm: searchTerm,
                    limit: itemTypes.length * 24 // TODO: temp
                },
                { signal }
            );

            if (searchData.Items) {
                for (const itemType of itemTypes) {
                    const items: BaseItemDto[] = [];
                    for (const searchItem of searchData.Items) {
                        if (searchItem.Type === itemType) {
                            items.push(searchItem);
                        }
                    }
                    addSection(sections, getTitleFromType(itemType), items, getCardOptionsFromType(itemType));
                }
            }

            // Livetv libraries
            if (collectionType && isLivetv(collectionType)) {
                //await fetchLiveTv(api, userId, searchTerm, signal, addSection);
            }

            return sections;
        },
        enabled: !!api && !!userId && !!isArtistsEnabled && !!isPeopleEnabled && !!isVideosEnabled
    });
};
