import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import escapeHtml from 'escape-html';
import type { ApiClient } from 'jellyfin-apiclient';

import cardBuilder from 'components/cardbuilder/cardBuilder';
import layoutManager from 'components/layoutManager';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getBackdropShape, getPortraitShape, getSquareShape } from 'utils/card';

import type { SectionContainerElement, SectionOptions } from './section';

function getFetchLatestItemsFn(
    serverId: string,
    parentId: string | undefined,
    collectionType: string | null | undefined,
    { enableOverflow }: SectionOptions
) {
    return function () {
        const apiClient = ServerConnections.getApiClient(serverId);
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

function getFetchRecentlyReleasedItemsFn(
    serverId: string,
    parentId: string | undefined,
    collectionType: string | null | undefined,
    { enableOverflow }: SectionOptions
) {
    return function () {
        const apiClient = ServerConnections.getApiClient(serverId);
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

function getItemsHtmlFn(
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

function renderCombinedSection(
    elem: HTMLElement,
    apiClient: ApiClient,
    user: UserDto,
    parent: BaseItemDto,
    options: SectionOptions,
    sectionType: 'released' | 'added',
    translationKey: string
) {
    let html = '';

    html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
    if (!layoutManager.tv) {
        html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl(parent, {
            section: 'latest'
        }) + '" class="more button-flat button-flat-mini sectionTitleTextButton">';
        html += '<h2 class="sectionTitle sectionTitle-cards">';
        html += globalize.translate(translationKey, escapeHtml(parent.Name));
        html += '</h2>';
        html += '<span class="material-icons chevron_right" aria-hidden="true"></span>';
        html += '</a>';
    } else {
        html += '<h2 class="sectionTitle sectionTitle-cards">' + globalize.translate(translationKey, escapeHtml(parent.Name)) + '</h2>';
    }
    html += '</div>';

    if (options.enableOverflow) {
        html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
        html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x">';
    } else {
        html += '<div is="emby-itemscontainer" class="itemsContainer focuscontainer-x padded-left padded-right vertical-wrap">';
    }

    if (options.enableOverflow) {
        html += '</div>';
    }
    html += '</div>';

    elem.innerHTML = html;

    const itemsContainer: SectionContainerElement | null = elem.querySelector('.itemsContainer');
    if (!itemsContainer) return;

    if (sectionType === 'released') {
        itemsContainer.fetchData = getFetchRecentlyReleasedItemsFn(apiClient.serverId(), parent.Id, parent.CollectionType, options);
    } else {
        itemsContainer.fetchData = getFetchLatestItemsFn(apiClient.serverId(), parent.Id, parent.CollectionType, options);
    }
    itemsContainer.getItemsHtml = getItemsHtmlFn(parent.Type, parent.CollectionType, options);
    itemsContainer.parentContainer = elem;
}

export function loadReleasedThenAdded(
    elem: HTMLElement,
    apiClient: ApiClient,
    user: UserDto,
    userViews: BaseItemDto[],
    options: SectionOptions
) {
    elem.classList.remove('verticalSection');
    const excludeViewTypes = ['playlists', 'livetv', 'boxsets', 'channels', 'folders'];
    const userExcludeItems = user.Configuration?.LatestItemsExcludes ?? [];

    userViews.forEach(item => {
        if (!item.Id || userExcludeItems.includes(item.Id)) {
            return;
        }

        if (item.CollectionType && excludeViewTypes.includes(item.CollectionType)) {
            return;
        }

        // Recently Released section
        const releasedFrag = document.createElement('div');
        releasedFrag.classList.add('verticalSection');
        releasedFrag.classList.add('hide');
        elem.appendChild(releasedFrag);
        renderCombinedSection(releasedFrag, apiClient, user, item, options, 'released', 'RecentlyReleasedFromLibrary');

        // Recently Added section
        const addedFrag = document.createElement('div');
        addedFrag.classList.add('verticalSection');
        addedFrag.classList.add('hide');
        elem.appendChild(addedFrag);
        renderCombinedSection(addedFrag, apiClient, user, item, options, 'added', 'LatestFromLibrary');
    });
}

export function loadAddedThenReleased(
    elem: HTMLElement,
    apiClient: ApiClient,
    user: UserDto,
    userViews: BaseItemDto[],
    options: SectionOptions
) {
    elem.classList.remove('verticalSection');
    const excludeViewTypes = ['playlists', 'livetv', 'boxsets', 'channels', 'folders'];
    const userExcludeItems = user.Configuration?.LatestItemsExcludes ?? [];

    userViews.forEach(item => {
        if (!item.Id || userExcludeItems.includes(item.Id)) {
            return;
        }

        if (item.CollectionType && excludeViewTypes.includes(item.CollectionType)) {
            return;
        }

        // Recently Added section
        const addedFrag = document.createElement('div');
        addedFrag.classList.add('verticalSection');
        addedFrag.classList.add('hide');
        elem.appendChild(addedFrag);
        renderCombinedSection(addedFrag, apiClient, user, item, options, 'added', 'LatestFromLibrary');

        // Recently Released section
        const releasedFrag = document.createElement('div');
        releasedFrag.classList.add('verticalSection');
        releasedFrag.classList.add('hide');
        elem.appendChild(releasedFrag);
        renderCombinedSection(releasedFrag, apiClient, user, item, options, 'released', 'RecentlyReleasedFromLibrary');
    });
}
