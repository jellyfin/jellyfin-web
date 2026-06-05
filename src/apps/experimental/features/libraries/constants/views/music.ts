import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

import { LibraryTab } from 'types/libraryTab';
import type { LibraryTabContent } from 'types/libraryTabContent';
import { SectionType } from 'types/sections';

const albumArtistsTabContent: LibraryTabContent = {
    viewType: LibraryTab.AlbumArtists,
    collectionType: CollectionType.Music,
    isBtnSortEnabled: false
};

const albumsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Albums,
    collectionType: CollectionType.Music,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true,
    itemType: [BaseItemKind.MusicAlbum]
};

const artistsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Artists,
    collectionType: CollectionType.Music,
    isBtnSortEnabled: false
};

const playlistsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Playlists,
    isBtnFilterEnabled: false,
    isBtnGridListEnabled: false,
    isBtnNewPlaylistEnabled: true,
    isAlphabetPickerEnabled: false,
    itemType: [BaseItemKind.Playlist]
};

const songsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Songs,
    isBtnShuffleEnabled: true,
    isBtnGridListEnabled: false,
    isAlphabetPickerEnabled: false,
    itemType: [BaseItemKind.Audio]
};

const suggestionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Suggestions,
    collectionType: CollectionType.Music,
    sectionsView: {
        suggestionSections: [
            SectionType.LatestMusic,
            SectionType.FrequentlyPlayedMusic,
            SectionType.RecentlyPlayedMusic
        ]
    }
};

const genresTabContent: LibraryTabContent = {
    viewType: LibraryTab.Genres,
    collectionType: CollectionType.Music,
    itemType: [BaseItemKind.MusicAlbum]
};

const collectionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Collections,
    collectionType: CollectionType.Music,
    isBtnNewCollectionEnabled: true,
    itemType: [BaseItemKind.BoxSet],
    noItemsMessage: 'MessageNoCollectionsAvailable'
};

const musicViews: Record<number, LibraryTabContent> = {
    0: albumsTabContent,
    1: suggestionsTabContent,
    2: albumArtistsTabContent,
    3: artistsTabContent,
    4: playlistsTabContent,
    5: songsTabContent,
    6: genresTabContent,
    7: collectionsTabContent
};

export default musicViews;
