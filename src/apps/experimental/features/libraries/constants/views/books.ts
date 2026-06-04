import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

import { LibraryTab } from 'types/libraryTab';
import type { LibraryTabContent } from 'types/libraryTabContent';
import { BookSuggestionsSectionsView } from 'types/sections';

const foldersTabContent: LibraryTabContent = {
    viewType: LibraryTab.Folders,
    collectionType: CollectionType.Books,
    itemType: [BaseItemKind.Folder, BaseItemKind.AudioBook, BaseItemKind.Book]
};

const booksTabContent: LibraryTabContent = {
    viewType: LibraryTab.Books,
    collectionType: CollectionType.Books,
    itemType: [BaseItemKind.AudioBook, BaseItemKind.Book]
};

const suggestionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Suggestions,
    collectionType: CollectionType.Books,
    sectionsView: BookSuggestionsSectionsView
};

const authorsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Authors,
    collectionType: CollectionType.Books,
    isBtnSortEnabled: false
};

const genresTabContent: LibraryTabContent = {
    viewType: LibraryTab.Genres,
    collectionType: CollectionType.Books,
    itemType: [BaseItemKind.AudioBook, BaseItemKind.Book]
};

const collectionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Collections,
    collectionType: CollectionType.Books,
    itemType: [BaseItemKind.BoxSet],
    isBtnNewCollectionEnabled: true,
    noItemsMessage: 'MessageNoCollectionsAvailable'
};

const favoritesTabContent: LibraryTabContent = {
    viewType: LibraryTab.Favorites,
    collectionType: CollectionType.Books,
    itemType: [BaseItemKind.AudioBook, BaseItemKind.Book]
};

const booksViews: Record<number, LibraryTabContent> = {
    0: foldersTabContent,
    1: booksTabContent,
    2: authorsTabContent,
    3: suggestionsTabContent,
    4: genresTabContent,
    5: collectionsTabContent,
    6: favoritesTabContent
};

export default booksViews;
