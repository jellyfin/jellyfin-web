import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { ApiClient } from 'jellyfin-apiclient';

import layoutManager from 'components/layoutManager';
import { playbackManager } from 'components/playback/playbackmanager';
import itemShortcuts from 'components/shortcuts';
import { ItemAction } from 'constants/itemAction';
import ServerConnections from 'lib/jellyfin-apiclient/ServerConnections';
import type { CardOptions } from 'types/cardOptions';

import { getDefaultText, getHoverMenuPlayButtonHtml } from './cardBuilder';
import { CardShape } from './utils/shape';
import { getCardImageUrl } from './utils/url';

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
        } else if (item.PrimaryImageAspectRatio > 0.8) {
            shape = CardShape.Square;
        } else {
            shape = CardShape.Portrait;
        }
    }

    const image = getCardImageUrl({
        api: ServerConnections.getApi(apiClient.serverId()),
        item,
        options,
        shape
    });

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

    const positionTicksData = item.UserData?.PlaybackPositionTicks ?
        ` data-positionticks="${item.UserData.PlaybackPositionTicks}"` :
        '';

    // The overlay buttons resolve the item from the closest ancestor carrying
    // the item data attributes, so they are set on the card itself.
    const dataAttributes = ` ${itemShortcuts.getShortcutAttributesHtml(item, options.serverId)}${positionTicksData}`;

    let hoverMenu = '';

    if (layoutManager.desktop && playbackManager.canPlay(item)) {
        hoverMenu = `<div class="cardOverlayContainer itemAction" data-action="${ItemAction.Resume}">${getHoverMenuPlayButtonHtml()}</div>`;
    }

    return (
        `<div class="card ${shape}Card${layoutManager.desktop ? ' card-hoverable' : ''}"${dataAttributes}>
    <div class="cardBox">
        <div class="cardScalable">
            <div class="cardPadder cardPadder-${shape}">
                ${cardPadderIcon}
            </div>
            <div
                class="cardImageContainer coveredImage cardContent lazy"
                style="cursor: default;"
                data-src="${imgUrl || ''}"
                ${blurhashAttrib}
            ></div>
            ${hoverMenu}
        </div>
    </div>
</div>`
    );
}
