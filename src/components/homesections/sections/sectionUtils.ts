import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import escapeHtml from 'escape-html';

import cardBuilder from 'components/cardbuilder/cardBuilder';
import layoutManager from 'components/layoutManager';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getBackdropShape, getPortraitShape, getSquareShape } from 'utils/card';

import type { SectionOptions } from './section';

/**
 * Calculate the limit for fetching items based on options and collection type
 */
function calculateItemLimit(
    collectionType: string | null | undefined,
    enableOverflow: boolean
): number {
    let limit = 16;

    if (enableOverflow) {
        if (collectionType === CollectionType.Music) {
            limit = 30;
        }
    } else if (collectionType === CollectionType.Tvshows) {
        limit = 5;
    } else if (collectionType === CollectionType.Music) {
        limit = 9;
    } else {
        limit = 8;
    }

    return limit;
}

/**
 * Creates a function that fetches latest items from the server
 */
export function getFetchLatestItemsFn(
    serverId: string,
    parentId: string | undefined,
    collectionType: string | null | undefined,
    { enableOverflow }: SectionOptions
) {
    return function () {
        const apiClient = ServerConnections.getApiClient(serverId);
        const limit = calculateItemLimit(collectionType, enableOverflow);

        const options = {
            Limit: limit,
            Fields: 'PrimaryImageAspectRatio,Path',
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Thumb',
            ParentId: parentId
        };

        return apiClient.getLatestItems(options);
    };
}

/**
 * Creates a function that fetches recently released items from the server
 */
export function getFetchRecentlyReleasedItemsFn(
    serverId: string,
    parentId: string | undefined,
    collectionType: string | null | undefined,
    { enableOverflow }: SectionOptions
) {
    return function () {
        const apiClient = ServerConnections.getApiClient(serverId);
        const limit = calculateItemLimit(collectionType, enableOverflow);

        const options = {
            Limit: limit,
            Fields: 'PrimaryImageAspectRatio,Path',
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Thumb',
            ParentId: parentId,
            SortBy: 'PremiereDate',
            SortOrder: 'Descending',
            Recursive: true
        };

        return apiClient.getItems(apiClient.getCurrentUserId(), options);
    };
}

/**
 * Creates a function that generates HTML for items
 */
export function getItemsHtmlFn(
    itemType: BaseItemKind | undefined,
    viewType: string | null | undefined,
    { enableOverflow }: SectionOptions
) {
    return function (items: BaseItemDto[]) {
        const cardLayout = false;
        let shape;
        if (itemType === 'Channel' || viewType === 'movies' || viewType === 'books' || viewType === 'tvshows') {
            shape = getPortraitShape(enableOverflow);
        } else if (viewType === 'music' || viewType === 'homevideos') {
            shape = getSquareShape(enableOverflow);
        } else {
            shape = getBackdropShape(enableOverflow);
        }

        return cardBuilder.getCardsHtml({
            items: items,
            shape: shape,
            preferThumb: viewType !== 'movies' && viewType !== 'tvshows' && itemType !== 'Channel' && viewType !== 'music' ? 'auto' : null,
            showUnplayedIndicator: false,
            showChildCountIndicator: true,
            context: 'home',
            overlayText: false,
            centerText: !cardLayout,
            overlayPlayButton: viewType !== 'photos',
            allowBottomPadding: !enableOverflow && !cardLayout,
            cardLayout: cardLayout,
            showTitle: viewType !== 'photos',
            showYear: viewType === 'movies' || viewType === 'tvshows' || !viewType,
            showParentTitle: viewType === 'music' || viewType === 'tvshows' || !viewType || (cardLayout && (viewType === 'tvshows')),
            lines: 2
        });
    };
}

/**
 * Generate the HTML for a section title
 */
export function generateSectionTitleHtml(
    parent: BaseItemDto,
    translationKey: string
): string {
    let html = '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
    
    if (layoutManager.tv) {
        html += '<h2 class="sectionTitle sectionTitle-cards">' + globalize.translate(translationKey, escapeHtml(parent.Name)) + '</h2>';
    } else {
        html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl(parent, {
            section: 'latest'
        }) + '" class="more button-flat button-flat-mini sectionTitleTextButton">';
        html += '<h2 class="sectionTitle sectionTitle-cards">';
        html += globalize.translate(translationKey, escapeHtml(parent.Name));
        html += '</h2>';
        html += '<span class="material-icons chevron_right" aria-hidden="true"></span>';
        html += '</a>';
    }
    
    html += '</div>';
    return html;
}

/**
 * Generate the HTML for the items container
 */
export function generateItemsContainerHtml(enableOverflow: boolean): string {
    let html = '';
    
    if (enableOverflow) {
        html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
        html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x">';
    } else {
        html += '<div is="emby-itemscontainer" class="itemsContainer focuscontainer-x padded-left padded-right vertical-wrap">';
    }

    if (enableOverflow) {
        html += '</div>';
    }
    html += '</div>';
    
    return html;
}
