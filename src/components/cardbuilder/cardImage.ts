import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { ApiClient } from 'jellyfin-apiclient';

import type { CardOptions } from 'types/cardOptions';
import { CardShape } from 'utils/card';

import { getCardImageUrl, getDefaultText } from './cardBuilder';

/**
 * Builds an html string for a basic image only card.
 */
export function buildCardImage(
    apiClient: ApiClient,
    item: BaseItemDto,
    options: CardOptions
): string {
    let shape: CardShape = CardShape.Square;
    if (item.PrimaryImageAspectRatio) {
        if (item.PrimaryImageAspectRatio >= 3) {
            shape = CardShape.Banner;
        } else if (item.PrimaryImageAspectRatio >= 1.33) {
            shape = CardShape.Backdrop;
        } else if (item.PrimaryImageAspectRatio > 0.71) {
            shape = CardShape.Square;
        } else {
            shape = CardShape.Portrait;
        }
    }

    const image = getCardImageUrl(
        item,
        apiClient,
        options,
        shape
    );

    if (!image) return '';

    const { blurhash, imgUrl } = image;

    let cardPadderIcon = '';
    // TV Channel logos are transparent so skip the placeholder to avoid overlapping
    if (imgUrl && item.Type !== BaseItemKind.TvChannel) {
        cardPadderIcon = getDefaultText(item, {
            // Always use an icon
            defaultCardImageIcon: 'folder',
            ...options
        });
    }

    let blurhashAttrib = '';
    if (blurhash && blurhash.length > 0) {
        blurhashAttrib = `data-blurhash="${blurhash}"`;
    }

    return (
        `<div class="card ${shape}Card">
    <div class="cardBox">
        <div class="cardScalable">
            <div class="cardPadder cardPadder-${shape}">
                ${cardPadderIcon}
            </div>
            <div
                class="cardImageContainer coveredImage cardContent lazy"
                style="cursor: default;"
                data-src="${imgUrl}"
                ${blurhashAttrib}
            ></div>
        </div>
    </div>
</div>`
    );
}
