import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';
import useCurrentTab from 'hooks/useCurrentTab';
import Page from 'components/Page';
import PageTabContent from '../../components/library/PageTabContent';
import { LibraryTab } from 'types/libraryTab';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';
import { MusicSuggestionsSectionsView } from 'types/sections';

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
    sectionsView: MusicSuggestionsSectionsView
};

const genresTabContent: LibraryTabContent = {
    viewType: LibraryTab.Genres,
    collectionType: CollectionType.Music,
    itemType: [BaseItemKind.MusicAlbum]
};

const musicTabMapping: LibraryTabMapping = {
    0: albumsTabContent,
    1: suggestionsTabContent,
    2: albumArtistsTabContent,
    3: artistsTabContent,
    4: playlistsTabContent,
    5: songsTabContent,
    6: genresTabContent
};

const Music: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = musicTabMapping[activeTab];

    return (
        <Page
            id='musicPage'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType='musicartist'
        >
            <PageTabContent
                key={`${currentTab.viewType} - ${libraryId}`}
                currentTab={currentTab}
                parentId={
                    // Playlists exist outside of the scope of the library
                    currentTab.viewType === LibraryTab.Playlists ? undefined : libraryId
                }
            />
        </Page>
    );
};

export default Music;
