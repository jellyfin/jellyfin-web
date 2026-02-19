import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';
import useCurrentTab from 'hooks/useCurrentTab';
import Page from 'components/Page';
import PageTabContent from '../../components/library/PageTabContent';
import { LibraryTab } from 'types/libraryTab';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';
import { TvShowSuggestionsSectionsView } from 'types/sections';

const episodesTabContent: LibraryTabContent = {
    viewType: LibraryTab.Episodes,
    itemType: [BaseItemKind.Episode],
    collectionType: CollectionType.Tvshows,
    isAlphabetPickerEnabled: false,
    noItemsMessage: 'MessageNoEpisodesFound'
};

const seriesTabContent: LibraryTabContent = {
    viewType: LibraryTab.Series,
    itemType: [BaseItemKind.Series],
    collectionType: CollectionType.Tvshows,
    isBtnShuffleEnabled: true
};

const networksTabContent: LibraryTabContent = {
    viewType: LibraryTab.Networks,
    itemType: [BaseItemKind.Series],
    isBtnFilterEnabled: false,
    isBtnGridListEnabled: false,
    isBtnSortEnabled: false,
    isAlphabetPickerEnabled: false
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

const tvShowsTabMapping: LibraryTabMapping = {
    0: seriesTabContent,
    1: suggestionsTabContent,
    2: upcomingTabContent,
    3: genresTabContent,
    4: networksTabContent,
    5: episodesTabContent
};

const Shows: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = tvShowsTabMapping[activeTab];

    return (
        <Page
            id='tvshowsPage'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType='series'
        >
            <PageTabContent
                key={`${currentTab.viewType} - ${libraryId}`}
                currentTab={currentTab}
                parentId={libraryId}
            />
        </Page>
    );
};

export default Shows;
