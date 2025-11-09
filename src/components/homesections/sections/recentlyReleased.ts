import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import escapeHtml from 'escape-html';
import type { ApiClient } from 'jellyfin-apiclient';

import layoutManager from 'components/layoutManager';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';

import type { SectionContainerElement, SectionOptions } from './section';
import { getFetchRecentlyReleasedItemsFn, getItemsHtmlFn } from './sectionUtils';

function renderRecentlyReleasedSection(
    elem: HTMLElement,
    apiClient: ApiClient,
    user: UserDto,
    parent: BaseItemDto,
    options: SectionOptions
) {
    let html = '';

    html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
    if (layoutManager.tv) {
        html += '<h2 class="sectionTitle sectionTitle-cards">' + globalize.translate('RecentlyReleasedFromLibrary', escapeHtml(parent.Name)) + '</h2>';
    } else {
        html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl(parent, {
            section: 'latest'
        }) + '" class="more button-flat button-flat-mini sectionTitleTextButton">';
        html += '<h2 class="sectionTitle sectionTitle-cards">';
        html += globalize.translate('RecentlyReleasedFromLibrary', escapeHtml(parent.Name));
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
    itemsContainer.fetchData = getFetchRecentlyReleasedItemsFn(apiClient.serverId(), parent.Id, parent.CollectionType, options);
    itemsContainer.getItemsHtml = getItemsHtmlFn(parent.Type, parent.CollectionType, options);
    itemsContainer.parentContainer = elem;
}

export function loadRecentlyReleased(
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

        const frag = document.createElement('div');
        frag.classList.add('verticalSection', 'hide');
        elem.appendChild(frag);

        renderRecentlyReleasedSection(frag, apiClient, user, item, options);
    }
}
