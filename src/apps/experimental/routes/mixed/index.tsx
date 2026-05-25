import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { type FC } from 'react';
import useCurrentTab from 'hooks/useCurrentTab';
import Page from 'components/Page';
import PageTabContent from '../../components/library/PageTabContent';
import { LibraryTab } from 'types/libraryTab';
import { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';
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

const mixedTabMapping: LibraryTabMapping = {
    0: foldersTabContent,
    1: suggestionsTabContent,
    2: mixedTabContent
};

const Mixed: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = mixedTabMapping[activeTab];

    return (
        <Page
            id='mixed'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType='movie, series'
        >
            <PageTabContent
                key={`${currentTab.viewType} - ${libraryId}`}
                currentTab={currentTab}
                parentId={libraryId}
            />
        </Page>
    );
};

export default Mixed;
