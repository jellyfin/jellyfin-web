import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';

import { LibraryTab } from 'types/libraryTab';
import type { LibraryTabContent } from 'types/libraryTabContent';
import { MixedSuggestionsSectionsView } from 'types/sections';

const foldersTabContent: LibraryTabContent = {
    viewType: LibraryTab.Folders,
    collectionType: null,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true,
    itemType: [BaseItemKind.Folder, BaseItemKind.Movie, BaseItemKind.Series]
};

const suggestionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Suggestions,
    collectionType: null,
    sectionsView: MixedSuggestionsSectionsView
};

const mixedTabContent: LibraryTabContent = {
    viewType: LibraryTab.Mixed,
    collectionType: null,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true,
    itemType: [BaseItemKind.Movie, BaseItemKind.Series]
};

const collectionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Collections,
    collectionType: null,
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

const mixedViews: Record<number, LibraryTabContent> = {
    0: foldersTabContent,
    1: suggestionsTabContent,
    2: mixedTabContent,
    3: collectionsTabContent,
    4: playlistsTabContent
};

export default mixedViews;
