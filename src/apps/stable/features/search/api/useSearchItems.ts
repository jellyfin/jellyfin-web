import type { AxiosRequestConfig } from 'axios';
import type { Api } from '@jellyfin/sdk';
import type {
    BaseItemDto,
    ItemsApiGetItemsRequest
} from '@jellyfin/sdk/lib/generated-client';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../../../hooks/useApi';
import type { CardOptions } from 'types/cardOptions';
import { CardShape } from 'utils/card';
import { getCardOptionsFromType, getItemTypesFromCollectionType, getTitleFromType, isMusic } from '../utils/search';
import { useArtistsSearch } from './useArtistsSearch';
import { usePeopleSearch } from './usePeopleSearch';
import { useVideoSearch } from './useVideoSearch';

const QUERY_OPTIONS = {
    limit: 100,
    fields: [
        ItemFields.PrimaryImageAspectRatio,
        ItemFields.CanDelete,
        ItemFields.MediaSourceCount
    ],
    enableTotalRecordCount: false,
    imageTypeLimit: 1
};

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

const isMovies = (collectionType: string) =>
    collectionType === CollectionType.Movies;

const isTVShows = (collectionType: string) =>
    collectionType === CollectionType.Tvshows;

const isLivetv = (collectionType: string) =>
    collectionType === CollectionType.Livetv;

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

export interface Section {
    title: string
    items: BaseItemDto[];
    cardOptions?: CardOptions;
}

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

    const isArtistsEnabled = !!(!isArtistsPending || (collectionType && !isMusic(collectionType)));
    const isPeopleEnabled = !!(!isPeoplePending || (collectionType && !isMovies(collectionType) && !isTVShows(collectionType)));
    const isVideosEnabled = !!(!isVideosPending || collectionType);

    return useQuery({
        queryKey: ['SearchItems', collectionType, parentId, searchTerm],
        queryFn: async ({ signal }) => {
            if (!api) throw new Error('No API instance available');
            if (!userId) throw new Error('No User ID provided');

            const sections: Section[] = [];

            const addSection = (
                title: string,
                items: BaseItemDto[] | null | undefined,
                cardOptions?: CardOptions
            ) => {
                if (items && items?.length > 0) {
                    sections.push({ title, items, cardOptions });
                }
            };

            addSection('Artists', artists?.Items, {
                coverImage: true
            });

            addSection('People', people?.Items, {
                coverImage: true
            });

            addSection('HeaderVideos', videos?.Items, {
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
                    limit: itemTypes.length * 24
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
                    addSection(getTitleFromType(itemType), items, getCardOptionsFromType(itemType));
                }
            }

            // Livetv libraries
            if (collectionType && isLivetv(collectionType)) {
                await fetchLiveTv(api, userId, searchTerm, signal, addSection);
            }

            return sections;
        },
        enabled: !!api && !!userId && isArtistsEnabled && isPeopleEnabled && isVideosEnabled
    });
};
