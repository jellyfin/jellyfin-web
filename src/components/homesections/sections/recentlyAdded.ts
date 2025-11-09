import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { ApiClient } from 'jellyfin-apiclient';

import type { SectionContainerElement, SectionOptions } from './section';
import {
    getFetchLatestItemsFn,
    getItemsHtmlFn,
    generateSectionTitleHtml,
    generateItemsContainerHtml
} from './sectionUtils';

function renderLatestSection(
    elem: HTMLElement,
    apiClient: ApiClient,
    user: UserDto,
    parent: BaseItemDto,
    options: SectionOptions
) {
    const html = generateSectionTitleHtml(parent, 'LatestFromLibrary') + generateItemsContainerHtml(options.enableOverflow);
    elem.innerHTML = html;

    const itemsContainer: SectionContainerElement | null = elem.querySelector('.itemsContainer');
    if (!itemsContainer) return;
    itemsContainer.fetchData = getFetchLatestItemsFn(apiClient.serverId(), parent.Id, parent.CollectionType, options);
    itemsContainer.getItemsHtml = getItemsHtmlFn(parent.Type, parent.CollectionType, options);
    itemsContainer.parentContainer = elem;
}

export function loadRecentlyAdded(
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

        const frag = document.createElement('div');
        frag.classList.add('verticalSection');
        frag.classList.add('hide');
        elem.appendChild(frag);

        renderLatestSection(frag, apiClient, user, item, options);
    });
}
