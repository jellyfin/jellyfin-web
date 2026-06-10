import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

import { LibraryTab } from 'types/libraryTab';
import type { LibraryTabContent } from 'types/libraryTabContent';

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

const boxSetsViews: Record<number, LibraryTabContent> = {
    0: collectionsTabContent,
    1: favoritesTabContent,
    2: genresTabContent
};

export default boxSetsViews;
