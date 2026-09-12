import type { Api } from '@jellyfin/sdk';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import type { AxiosRequestConfig } from 'axios';

import { CardShape } from 'components/cardbuilder/utils/shape';
import type { CardOptions } from 'types/cardOptions';

import { LIVETV_CARD_OPTIONS } from '../constants/liveTvCardOptions';
import { SEARCH_SECTIONS_SORT_ORDER } from '../constants/sectionSortOrder';
import type { Section } from '../types';
import { getCardOptionsFromType, getItemTypesFromCollectionType, getTitleFromType, isLivetv, isMovies, isMusic, isTVShows, sortSections } from '../utils/search';
import { getSearchShapeForType } from '../utils/searchLimit';
import { fetchArtists } from './fetchArtists';
import { fetchItemsByType } from './fetchItemsByType';
import { fetchLiveTv } from './fetchLiveTv';
import { fetchPeople } from './fetchPeople';
import { fetchPrograms } from './fetchPrograms';
import { fetchStudios } from './fetchStudios';
import { fetchVideos } from './fetchVideos';

/** Number of sections to load before waiting for the user to scroll to the end of the results. */
export const INITIAL_SECTION_COUNT = 4;

const DEFAULT_CARD_OPTIONS: CardOptions = {
    shape: CardShape.AutoOverflow,
    scalable: true,
    showTitle: true,
    overlayText: false,
    centerText: true,
    allowBottomPadding: false
};

export interface SearchSectionParams {
    parentId?: string;
    searchTerm?: string;
    limit: number;
    displayMissingEpisodes?: boolean;
}

export interface SearchSectionSpec {
    /** The section title translation key. Also used for ordering and as part of the query key. */
    id: string;
    /** The card shape the section is expected to render with, used to size its request. */
    shape: CardShape;
    fetch: (
        api: Api,
        userId: string,
        params: SearchSectionParams,
        options: AxiosRequestConfig
    ) => Promise<Section[]>;
}

const withDefaultCardOptions = (section: Section): Section => ({
    ...section,
    cardOptions: {
        ...DEFAULT_CARD_OPTIONS,
        ...section.cardOptions
    }
});

const toSections = (title: string, items: BaseItemDto[] | null | undefined, cardOptions?: CardOptions): Section[] => (
    items?.length ? [ withDefaultCardOptions({ title, items, cardOptions }) ] : []
);

const getItemTypeSpec = (type: BaseItemKind): SearchSectionSpec => ({
    id: getTitleFromType(type),
    shape: getSearchShapeForType(type),
    fetch: async (api, userId, { parentId, searchTerm, limit, displayMissingEpisodes }, options) => {
        const result = await fetchItemsByType(
            api,
            userId,
            {
                includeItemTypes: [ type ],
                parentId,
                searchTerm,
                limit,
                isMissing: type === BaseItemKind.Episode && !displayMissingEpisodes ? false : undefined
            },
            options
        );

        return toSections(getTitleFromType(type), result.Items, getCardOptionsFromType(type));
    }
});

const ARTISTS_SPEC: SearchSectionSpec = {
    id: 'Artists',
    shape: CardShape.SquareOverflow,
    fetch: async (api, userId, { parentId, searchTerm, limit }, options) => {
        const result = await fetchArtists(api, userId, { parentId, searchTerm, limit }, options);
        return toSections('Artists', result.Items, { coverImage: true });
    }
};

const PEOPLE_SPEC: SearchSectionSpec = {
    id: 'People',
    shape: CardShape.PortraitOverflow,
    fetch: async (api, userId, { searchTerm, limit }, options) => {
        const result = await fetchPeople(api, userId, { searchTerm, limit }, options);
        return toSections('People', result.Items, { coverImage: true });
    }
};

const STUDIOS_SPEC: SearchSectionSpec = {
    id: 'Studios',
    shape: CardShape.SquareOverflow,
    fetch: async (api, userId, { parentId, searchTerm, limit }, options) => {
        const result = await fetchStudios(api, userId, { parentId, searchTerm, limit }, options);
        return toSections('Studios', result.Items, { shape: CardShape.SquareOverflow });
    }
};

const VIDEOS_SPEC: SearchSectionSpec = {
    id: 'HeaderVideos',
    shape: CardShape.BackdropOverflow,
    fetch: async (api, userId, { parentId, searchTerm, limit }, options) => {
        const result = await fetchVideos(api, userId, { parentId, searchTerm, limit }, options);
        return toSections('HeaderVideos', result.Items, { showParentTitle: true });
    }
};

const PROGRAMS_SPEC: SearchSectionSpec = {
    id: 'Programs',
    shape: CardShape.BackdropOverflow,
    fetch: async (api, userId, { parentId, searchTerm, limit }, options) => {
        const result = await fetchPrograms(api, userId, { parentId, searchTerm, limit }, options);
        return toSections('Programs', result.Items, { ...LIVETV_CARD_OPTIONS });
    }
};

const LIVETV_SPEC: SearchSectionSpec = {
    id: 'LiveTv',
    shape: CardShape.BackdropOverflow,
    fetch: async (api, userId, { searchTerm, limit }, options) => {
        const sections = await fetchLiveTv(api, userId, { searchTerm, limit }, options);
        return sortSections(sections).map(withDefaultCardOptions);
    }
};

/**
 * Returns the search sections that apply to a collection type, in display order.
 * Each section is fetched by its own request so one type of item cannot crowd out the others.
 */
export const getSearchSections = (collectionType?: CollectionType): SearchSectionSpec[] => {
    if (collectionType && isLivetv(collectionType)) {
        return [ LIVETV_SPEC ];
    }

    const specs = getItemTypesFromCollectionType(collectionType).map(type => getItemTypeSpec(type));

    if (!collectionType || isMusic(collectionType)) {
        specs.push(ARTISTS_SPEC);
    }

    if (!collectionType || isMovies(collectionType) || isTVShows(collectionType)) {
        specs.push(PEOPLE_SPEC, STUDIOS_SPEC);
    }

    if (!collectionType) {
        specs.push(VIDEOS_SPEC, PROGRAMS_SPEC);
    }

    return specs.sort((a, b) => SEARCH_SECTIONS_SORT_ORDER.indexOf(a.id) - SEARCH_SECTIONS_SORT_ORDER.indexOf(b.id));
};
