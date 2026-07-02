import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { LibraryTab } from 'types/libraryTab';
import type { LibraryTabContent } from 'types/libraryTabContent';

const moviesTabContent: LibraryTabContent = {
    viewType: LibraryTab.Favorites,
    itemType: [BaseItemKind.Movie],
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true
};

const showsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Favorites,
    itemType: [BaseItemKind.Series],
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true
};

const episodesTabContent: LibraryTabContent = {
    viewType: LibraryTab.Favorites,
    itemType: [BaseItemKind.Episode],
    isAlphabetPickerEnabled: false,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true
};

const favoritesViews: Record<number, LibraryTabContent> = {
    0: moviesTabContent,
    1: showsTabContent,
    2: episodesTabContent
};

export default favoritesViews;
