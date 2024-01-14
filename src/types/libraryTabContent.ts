import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { LibraryTab } from './libraryTab';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { SectionType } from './sections';

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
    isBtnGridListEnabled?: boolean;
    isAlphabetPickerEnabled?: boolean;
    noItemsMessage?: string;
}

export type LibraryTabMapping = Record<number, LibraryTabContent>;
