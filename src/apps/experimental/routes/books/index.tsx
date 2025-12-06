import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';
import useCurrentTab from 'hooks/useCurrentTab';
import Page from 'components/Page';
import PageTabContent from '../../components/library/PageTabContent';
import { LibraryTab } from 'types/libraryTab';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';
import { BookSuggestionsSectionsView } from 'types/sections';

const booksTabContent: LibraryTabContent = {
    viewType: LibraryTab.Books,
    collectionType: CollectionType.Books,
    itemType: [BaseItemKind.Book]
};

const suggestionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Suggestions,
    collectionType: CollectionType.Books,
    sectionsView: BookSuggestionsSectionsView
};

const genresTabContent: LibraryTabContent = {
    viewType: LibraryTab.Genres,
    collectionType: CollectionType.Books,
    itemType: [BaseItemKind.Book]
};

const booksTabMapping: LibraryTabMapping = {
    0: booksTabContent,
    1: suggestionsTabContent,
    2: genresTabContent
};

const Books: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = booksTabMapping[activeTab];

    return (
        <Page
            id='booksPage'
            className='mainAnimatedPage libraryPage pageWithAbsoluteTabs withTabs'
        >
            <PageTabContent
                key={`${currentTab.viewType} - ${libraryId}`}
                currentTab={currentTab}
                parentId={libraryId}
            />
        </Page>
    );
};

export default Books;
