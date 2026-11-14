import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

import { CardShape } from 'components/cardbuilder/utils/shape';
import { LibraryTab } from 'types/libraryTab';

/**
 * Gets the canonical card shape for the content of a library tab.
 * @param viewType - The library tab being displayed.
 * @param collectionType - The collection type of the library.
 * @returns The card shape, or undefined if the content has no canonical shape.
 */
export const getLibraryTabShape = (
    viewType: LibraryTab,
    collectionType?: CollectionType | null
): CardShape | undefined => {
    switch (viewType) {
        case LibraryTab.Movies:
        case LibraryTab.Series:
            return CardShape.Portrait;
        case LibraryTab.Episodes:
            return CardShape.Backdrop;
        case LibraryTab.Albums:
        case LibraryTab.AlbumArtists:
        case LibraryTab.Artists:
        case LibraryTab.Songs:
        case LibraryTab.Playlists:
        case LibraryTab.Channels:
            return CardShape.Square;
        case LibraryTab.Collections:
            if (collectionType === CollectionType.Movies || collectionType === CollectionType.Tvshows) {
                return CardShape.Portrait;
            }
            return undefined;
        case LibraryTab.Favorites:
            if (collectionType === CollectionType.Movies) {
                return CardShape.Portrait;
            }
            if (collectionType === CollectionType.Playlists) {
                return CardShape.Square;
            }
            return undefined;
        default:
            return undefined;
    }
};
