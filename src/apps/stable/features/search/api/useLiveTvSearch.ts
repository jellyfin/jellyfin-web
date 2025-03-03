import { Api } from '@jellyfin/sdk';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { addSection, isLivetv } from '../utils/search';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { LIVETV_CARD_OPTIONS } from '../constants/liveTvCardOptions';
import { CardShape } from 'utils/card';
import { Section } from '../types';
import { fetchItemsByType } from './fetchItemsByType';

const fetchLiveTv = async (api: Api, userId: string | undefined, searchTerm: string | undefined, signal: AbortSignal) => {
    const sections: Section[] = [];

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
    addSection(sections, 'Movies', moviesData.Items, {
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
    addSection(sections, 'Episodes', episodesData.Items, {
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
    addSection(sections, 'Sports', sportsData.Items, {
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
    addSection(sections, 'Kids', kidsData.Items, {
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
    addSection(sections, 'News', newsData.Items, {
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
    addSection(sections, 'Programs', programsData.Items, {
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
    addSection(sections, 'Channels', channelsData.Items);

    return sections;
};

export const useLiveTvSearch = (
    parentId?: string,
    collectionType?: CollectionType,
    searchTerm?: string
) => {
    const { api, user } = useApi();
    const userId = user?.Id;

    return useQuery({
        queryKey: ['LiveTv', collectionType, parentId, searchTerm],
        queryFn: async ({ signal }) =>
            fetchLiveTv(api!, userId!, searchTerm, signal),
        enabled: !!api && !!userId && !!collectionType && !!isLivetv(collectionType)
    });
};
