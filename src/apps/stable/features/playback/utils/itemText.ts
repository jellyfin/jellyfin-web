import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';

import type { ItemDto } from 'types/base/models/item-dto';

/**
 * Gets lines of text used to describe an item for display.
 * @param nowPlayingItem The item to describe
 * @param isYearIncluded Should the production year be included
 * @returns The list of strings describing the item for display
 */
export function getItemTextLines(
    nowPlayingItem: ItemDto | null | undefined,
    isYearIncluded = true
) {
    let line1 = nowPlayingItem?.Name;
    if (nowPlayingItem?.MediaType === MediaType.Video) {
        if (nowPlayingItem.IndexNumber != null) {
            line1 = nowPlayingItem.IndexNumber + ' - ' + line1;
        }
        if (nowPlayingItem.ParentIndexNumber != null) {
            line1 = nowPlayingItem.ParentIndexNumber + '.' + line1;
        }
    }

    let line2: string | null | undefined;
    if (nowPlayingItem?.ArtistItems?.length) {
        line2 = nowPlayingItem.ArtistItems.map(a => a.Name).join(', ');
    } else if (nowPlayingItem?.Artists?.length) {
        line2 = nowPlayingItem.Artists.join(', ');
    } else if (nowPlayingItem?.SeriesName || nowPlayingItem?.Album) {
        line2 = line1;
        line1 = nowPlayingItem.SeriesName || nowPlayingItem.Album;
    } else if (nowPlayingItem?.ProductionYear && isYearIncluded) {
        line2 = String(nowPlayingItem.ProductionYear);
    }

    if (!line1) return;

    const lines = [ line1 ];

    if (line2) lines.push(line2);

    return lines;
}
