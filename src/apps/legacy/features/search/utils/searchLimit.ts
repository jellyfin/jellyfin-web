import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';

import { getPostersPerRow } from 'components/cardbuilder/utils/builder';
import { CardShape } from 'components/cardbuilder/utils/shape';

/** How many screen widths of cards to request for each search section. */
export const SEARCH_SECTION_PAGES = 3;

/**
 * Returns the card shape a search section for an item type is expected to render with.
 * Search rows use the auto overflow shape, which is only resolved per item once results are
 * loaded, so this is an estimate used to size the request rather than the shape that is rendered.
 */
export function getSearchShapeForType(type: BaseItemKind): CardShape {
    switch (type) {
        case BaseItemKind.Movie:
        case BaseItemKind.Series:
        case BaseItemKind.BoxSet:
        case BaseItemKind.Book:
        case BaseItemKind.AudioBook:
            return CardShape.PortraitOverflow;
        case BaseItemKind.Episode:
        case BaseItemKind.TvChannel:
        case BaseItemKind.LiveTvProgram:
            return CardShape.BackdropOverflow;
        default:
            return CardShape.SquareOverflow;
    }
}

/**
 * Computes how many items to request for a search section so that it fills a few screen widths of
 * cards at the current screen size instead of using one fixed limit for every screen.
 * @param shape The card shape the section renders with.
 * @param screenWidth The window width in pixels.
 * @param screenHeight The window height in pixels.
 * @param isTV Whether the TV layout is active.
 * @param pages The number of screen widths of cards to request.
 */
export function getSearchLimit(
    shape: CardShape,
    screenWidth: number,
    screenHeight: number,
    isTV: boolean,
    pages = SEARCH_SECTION_PAGES
): number {
    const isLandscape = screenWidth > (screenHeight * 1.3);
    const cardsPerRow = Math.ceil(getPostersPerRow(shape, screenWidth, isLandscape, isTV));

    return cardsPerRow * pages;
}
