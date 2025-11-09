import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import escapeHtml from 'escape-html';
import type { ApiClient } from 'jellyfin-apiclient';

import layoutManager from 'components/layoutManager';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';

import type { SectionContainerElement, SectionOptions } from './section';
import { getFetchLatestItemsFn, getFetchRecentlyReleasedItemsFn, getItemsHtmlFn } from './sectionUtils';

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
    const excludeViewTypes = new Set(['playlists', 'livetv', 'boxsets', 'channels', 'folders']);
    const userExcludeItems = user.Configuration?.LatestItemsExcludes ?? [];

    for (const item of userViews) {
        if (!item.Id || userExcludeItems.includes(item.Id)) {
            continue;
        }

        if (item.CollectionType && excludeViewTypes.has(item.CollectionType)) {
            continue;
        }

        // Recently Released section
        const releasedFrag = document.createElement('div');
        releasedFrag.classList.add('verticalSection', 'hide');
        elem.appendChild(releasedFrag);
        renderCombinedSection(releasedFrag, apiClient, user, item, options, 'released', 'RecentlyReleasedFromLibrary');

        // Recently Added section
        const addedFrag = document.createElement('div');
        addedFrag.classList.add('verticalSection', 'hide');
        elem.appendChild(addedFrag);
        renderCombinedSection(addedFrag, apiClient, user, item, options, 'added', 'LatestFromLibrary');
    }
}

export function loadAddedThenReleased(
    elem: HTMLElement,
    apiClient: ApiClient,
    user: UserDto,
    userViews: BaseItemDto[],
    options: SectionOptions
) {
    elem.classList.remove('verticalSection');
    const excludeViewTypes = new Set(['playlists', 'livetv', 'boxsets', 'channels', 'folders']);
    const userExcludeItems = user.Configuration?.LatestItemsExcludes ?? [];

    for (const item of userViews) {
        if (!item.Id || userExcludeItems.includes(item.Id)) {
            continue;
        }

        if (item.CollectionType && excludeViewTypes.has(item.CollectionType)) {
            continue;
        }

        // Recently Added section
        const addedFrag = document.createElement('div');
        addedFrag.classList.add('verticalSection', 'hide');
        elem.appendChild(addedFrag);
        renderCombinedSection(addedFrag, apiClient, user, item, options, 'added', 'LatestFromLibrary');

        // Recently Released section
        const releasedFrag = document.createElement('div');
        releasedFrag.classList.add('verticalSection', 'hide');
        elem.appendChild(releasedFrag);
        renderCombinedSection(releasedFrag, apiClient, user, item, options, 'released', 'RecentlyReleasedFromLibrary');
    }
}
