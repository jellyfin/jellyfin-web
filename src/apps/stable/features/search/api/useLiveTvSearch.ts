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

const fetchLiveTv = (api: Api, userId: string | undefined, searchTerm: string | undefined, signal: AbortSignal) => {
    const sections: Section[] = [];

    // Movies row
    const movies = fetchItemsByType(
        api,
        userId,
        {
            includeItemTypes: [ BaseItemKind.LiveTvProgram ],
            isMovie: true,
            searchTerm: searchTerm
        },
        { signal }
    ).then(moviesData => {
        addSection(sections, 'Movies', moviesData.Items, {
            ...LIVETV_CARD_OPTIONS,
            shape: CardShape.PortraitOverflow
        });
    });

    // Episodes row
    const episodes = fetchItemsByType(
        api,
        userId,
        {
            includeItemTypes: [ BaseItemKind.LiveTvProgram ],
            isMovie: false,
            isSeries: true,
            isSports: false,
            isKids: false,
            isNews: false,
            searchTerm: searchTerm
        },
        { signal }
    ).then(episodesData => {
        addSection(sections, 'Episodes', episodesData.Items, {
            ...LIVETV_CARD_OPTIONS
        });
    });

    // Sports row
    const sports = fetchItemsByType(
        api,
        userId,
        {
            includeItemTypes: [ BaseItemKind.LiveTvProgram ],
            isSports: true,
            searchTerm: searchTerm
        },
        { signal }
    ).then(sportsData => {
        addSection(sections, 'Sports', sportsData.Items, {
            ...LIVETV_CARD_OPTIONS
        });
    });

    // Kids row
    const kids = fetchItemsByType(
        api,
        userId,
        {
            includeItemTypes: [ BaseItemKind.LiveTvProgram ],
            isKids: true,
            searchTerm: searchTerm
        },
        { signal }
    ).then(kidsData => {
        addSection(sections, 'Kids', kidsData.Items, {
            ...LIVETV_CARD_OPTIONS
        });
    });

    // News row
    const news = fetchItemsByType(
        api,
        userId,
        {
            includeItemTypes: [ BaseItemKind.LiveTvProgram ],
            isNews: true,
            searchTerm: searchTerm
        },
        { signal }
    ).then(newsData => {
        addSection(sections, 'News', newsData.Items, {
            ...LIVETV_CARD_OPTIONS
        });
    });

    // Programs row
    const programs = fetchItemsByType(
        api,
        userId,
        {
            includeItemTypes: [ BaseItemKind.LiveTvProgram ],
            isMovie: false,
            isSeries: false,
            isSports: false,
            isKids: false,
            isNews: false,
            searchTerm: searchTerm
        },
        { signal }
    ).then(programsData => {
        addSection(sections, 'Programs', programsData.Items, {
            ...LIVETV_CARD_OPTIONS
        });
    });

    // Channels row
    const channels = fetchItemsByType(
        api,
        userId,
        {
            includeItemTypes: [ BaseItemKind.TvChannel ],
            searchTerm: searchTerm
        },
        { signal }
    ).then(channelsData => {
        addSection(sections, 'Channels', channelsData.Items);
    });

    return Promise.all([ movies, episodes, sports, kids, news, programs, channels ]).then(() => sections);
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
        queryFn: ({ signal }) =>
            fetchLiveTv(api!, userId!, searchTerm, signal),
        enabled: !!api && !!userId && !!collectionType && !!isLivetv(collectionType)
    });
};
