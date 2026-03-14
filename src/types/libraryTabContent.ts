import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import type { LibraryTab } from './libraryTab';
import type { SectionType } from './sections';

export interface SectionsView {
    suggestionSections?: SectionType[];
    favoriteSections?: SectionType[];
    programSections?: SectionType[];
    isMovieRecommendations?: boolean;
    isLiveTvUpcomingRecordings?: boolean;
}

export interface LibraryTabContent {
    viewType: LibraryTab;
    itemType?: BaseItemKind[];
    collectionType?: CollectionType;
    sectionsView?: SectionsView;
    isPaginationEnabled?: boolean;
    isBtnPlayAllEnabled?: boolean;
    isBtnQueueEnabled?: boolean;
    isBtnShuffleEnabled?: boolean;
    isBtnSortEnabled?: boolean;
    isBtnFilterEnabled?: boolean;
    isBtnNewCollectionEnabled?: boolean;
    isBtnNewPlaylistEnabled?: boolean;
    isBtnGridListEnabled?: boolean;
    isAlphabetPickerEnabled?: boolean;
    noItemsMessage?: string;
}

export type LibraryTabMapping = Record<number, LibraryTabContent>;
