import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { ApiClient } from 'jellyfin-apiclient';

import type { SectionContainerElement, SectionOptions } from './section';
import { 
    getFetchRecentlyReleasedItemsFn, 
    getItemsHtmlFn,
    generateSectionTitleHtml,
    generateItemsContainerHtml
} from './sectionUtils';

function renderRecentlyReleasedSection(
    elem: HTMLElement,
    apiClient: ApiClient,
    user: UserDto,
    parent: BaseItemDto,
    options: SectionOptions
) {
    const html = generateSectionTitleHtml(parent, 'RecentlyReleasedFromLibrary') + generateItemsContainerHtml(options.enableOverflow);
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
