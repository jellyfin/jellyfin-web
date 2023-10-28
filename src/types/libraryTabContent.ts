import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { LibraryTab } from './libraryTab';
import { CollectionType } from './collectionType';
import { SectionsView } from './suggestionsSections';

export interface SuggestionsSectionsType {
    suggestionSectionsView: SectionsView[];
    isMovieRecommendations?: boolean;
}

export interface LibraryTabContent {
    viewType: LibraryTab;
    itemType?: BaseItemKind[];
    collectionType?: CollectionType;
    sectionsType?: SuggestionsSectionsType;
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
