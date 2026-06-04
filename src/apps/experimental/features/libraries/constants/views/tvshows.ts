import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

import { LibraryTab } from 'types/libraryTab';
import type { LibraryTabContent } from 'types/libraryTabContent';
import { TvShowSuggestionsSectionsView } from 'types/sections';

const episodesTabContent: LibraryTabContent = {
    viewType: LibraryTab.Episodes,
    itemType: [BaseItemKind.Episode],
    collectionType: CollectionType.Tvshows,
    isAlphabetPickerEnabled: false,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true,
    noItemsMessage: 'MessageNoEpisodesFound'
};

const seriesTabContent: LibraryTabContent = {
    viewType: LibraryTab.Series,
    itemType: [BaseItemKind.Series],
    collectionType: CollectionType.Tvshows,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true
};

const studiosTabContent: LibraryTabContent = {
    viewType: LibraryTab.Studios,
    itemType: [BaseItemKind.Series],
    isBtnGridListEnabled: false,
    isBtnSortEnabled: false
};

const upcomingTabContent: LibraryTabContent = {
    viewType: LibraryTab.Upcoming
};

const suggestionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Suggestions,
    collectionType: CollectionType.Tvshows,
    sectionsView: TvShowSuggestionsSectionsView
};

const genresTabContent: LibraryTabContent = {
    viewType: LibraryTab.Genres,
    itemType: [BaseItemKind.Series],
    collectionType: CollectionType.Tvshows
};

const collectionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Collections,
    collectionType: CollectionType.Tvshows,
    isBtnNewCollectionEnabled: true,
    itemType: [BaseItemKind.BoxSet],
    noItemsMessage: 'MessageNoCollectionsAvailable'
};

const playlistsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Playlists,
    isBtnFilterEnabled: false,
    isBtnGridListEnabled: false,
    isBtnNewPlaylistEnabled: true,
    isAlphabetPickerEnabled: false,
    itemType: [BaseItemKind.Playlist]
};

const tvShowsViews: Record<number, LibraryTabContent> = {
    0: seriesTabContent,
    1: suggestionsTabContent,
    2: upcomingTabContent,
    3: genresTabContent,
    4: studiosTabContent,
    5: episodesTabContent,
    6: collectionsTabContent,
    7: playlistsTabContent
};

export default tvShowsViews;
