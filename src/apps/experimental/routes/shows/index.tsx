import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';
import useCurrentTab from 'hooks/useCurrentTab';
import Page from 'components/Page';
import PageTabContent from '../../components/library/PageTabContent';
import { LibraryTab } from 'types/libraryTab';
import { CollectionType } from 'types/collectionType';
import { SectionsView } from 'types/suggestionsSections';
import { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';

const episodesTabContent: LibraryTabContent = {
    viewType: LibraryTab.Episodes,
    itemType: [BaseItemKind.Episode],
    collectionType: CollectionType.TvShows,
    isAlphabetPickerEnabled: false,
    noItemsMessage: 'MessageNoEpisodesFound'
};

const seriesTabContent: LibraryTabContent = {
    viewType: LibraryTab.Series,
    itemType: [BaseItemKind.Series],
    collectionType: CollectionType.TvShows,
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
    collectionType: CollectionType.TvShows,
    sectionsType: {
        suggestionSectionsView: [
            SectionsView.ContinueWatchingEpisode,
            SectionsView.LatestEpisode,
            SectionsView.NextUp
        ]
    }
};

const genresTabContent: LibraryTabContent = {
    viewType: LibraryTab.Genres,
    itemType: [BaseItemKind.Series],
    collectionType: CollectionType.TvShows
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
    const { searchParamsParentId, currentTabIndex } = useCurrentTab();
    const currentTab = tvShowsTabMapping[currentTabIndex];

    return (
        <Page
            id='tvshowsPage'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType='series'
        >
            <PageTabContent
                key={`${currentTab.viewType} - ${searchParamsParentId}`}
                currentTab={currentTab}
                parentId={searchParamsParentId}
            />
        </Page>
    );
};

export default Shows;
