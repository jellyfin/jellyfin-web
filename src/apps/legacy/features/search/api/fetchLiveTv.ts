import { Api } from '@jellyfin/sdk';
import { AxiosRequestConfig } from 'axios';
import { addSection } from '../utils/search';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { LIVETV_CARD_OPTIONS } from '../constants/liveTvCardOptions';
import { CardShape } from 'components/cardbuilder/utils/shape';
import { Section } from '../types';
import { LibraryApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';
import { fetchItemsByType } from './fetchItemsByType';

export const fetchLiveTv = (
    api: Api,
    userId: string | undefined,
    params?: LibraryApiGetItemsRequest,
    options?: AxiosRequestConfig
) => {
    const sections: Section[] = [];

    // Movies row
    const movies = fetchItemsByType(
        api,
        userId,
        {
            includeItemTypes: [ BaseItemKind.LiveTvProgram ],
            isMovie: true,
            ...params
        },
        options
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
            ...params
        },
        options
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
            ...params
        },
        options
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
            ...params
        },
        options
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
            ...params
        },
        options
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
            ...params
        },
        options
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
            ...params
        },
        options
    ).then(channelsData => {
        addSection(sections, 'Channels', channelsData.Items);
    });

    return Promise.all([ movies, episodes, sports, kids, news, programs, channels ]).then(() => sections);
};
