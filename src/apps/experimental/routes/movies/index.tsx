import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';
import useCurrentTab from 'hooks/useCurrentTab';
import Page from 'components/Page';
import PageTabContent from '../../components/library/PageTabContent';
import { LibraryTab } from 'types/libraryTab';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';
import { MovieSuggestionsSectionsView } from 'types/sections';

const moviesTabContent: LibraryTabContent = {
    viewType: LibraryTab.Movies,
    collectionType: CollectionType.Movies,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true,
    itemType: [BaseItemKind.Movie]
};

const collectionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Collections,
    collectionType: CollectionType.Movies,
    isBtnNewCollectionEnabled: true,
    itemType: [BaseItemKind.BoxSet],
    noItemsMessage: 'MessageNoCollectionsAvailable'
};

const favoritesTabContent: LibraryTabContent = {
    viewType: LibraryTab.Favorites,
    collectionType: CollectionType.Movies,
    itemType: [BaseItemKind.Movie]
};

const suggestionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Suggestions,
    collectionType: CollectionType.Movies,
    sectionsView: MovieSuggestionsSectionsView
};

const genresTabContent: LibraryTabContent = {
    viewType: LibraryTab.Genres,
    collectionType: CollectionType.Movies,
    itemType: [BaseItemKind.Movie]
};

const playlistsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Playlists,
    isBtnFilterEnabled: false,
    isBtnGridListEnabled: false,
    isBtnNewPlaylistEnabled: true,
    isAlphabetPickerEnabled: false,
    itemType: [BaseItemKind.Playlist]
};

const studiosTabContent: LibraryTabContent = {
    viewType: LibraryTab.Studios,
    itemType: [BaseItemKind.Movie],
    isBtnFilterEnabled: false,
    isBtnGridListEnabled: false,
    isBtnSortEnabled: false,
    isAlphabetPickerEnabled: false
};

const moviesTabMapping: LibraryTabMapping = {
    0: moviesTabContent,
    1: suggestionsTabContent,
    2: favoritesTabContent,
    3: collectionsTabContent,
    4: genresTabContent,
    5: studiosTabContent,
    6: playlistsTabContent
};

const Movies: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = moviesTabMapping[activeTab];

    return (
        <Page
            id='moviesPage'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType='movie'
        >
            <PageTabContent
                key={`${currentTab.viewType} - ${libraryId}`}
                currentTab={currentTab}
                parentId={libraryId}
            />
        </Page>
    );
};

export default Movies;
