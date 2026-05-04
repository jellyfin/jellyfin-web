import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';
import useCurrentTab from 'hooks/useCurrentTab';
import Page from 'components/Page';
import PageTabContent from '../../components/library/PageTabContent';
import { LibraryTab } from 'types/libraryTab';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';

const collectionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Collections,
    collectionType: CollectionType.Boxsets,
    isBtnNewCollectionEnabled: true,
    itemType: [BaseItemKind.BoxSet]
};

const favoritesTabContent: LibraryTabContent = {
    viewType: LibraryTab.Favorites,
    collectionType: CollectionType.Boxsets,
    itemType: [BaseItemKind.BoxSet]
};

const genresTabContent: LibraryTabContent = {
    viewType: LibraryTab.Genres,
    collectionType: CollectionType.Boxsets,
    itemType: [BaseItemKind.BoxSet]
};

const boxSetsTabMapping: LibraryTabMapping = {
    0: collectionsTabContent,
    1: favoritesTabContent,
    2: genresTabContent
};

const BoxSets: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = boxSetsTabMapping[activeTab];

    return (
        <Page
            id='boxsetsPage'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType='boxsets'
        >
            <PageTabContent
                key={`${currentTab.viewType} - ${libraryId}`}
                currentTab={currentTab}
                parentId={libraryId}
            />
        </Page>
    );
};

export default BoxSets;
