import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { ApiClient } from 'jellyfin-apiclient';

import type { SectionContainerElement, SectionOptions } from './section';
import { 
    getFetchLatestItemsFn, 
    getFetchRecentlyReleasedItemsFn, 
    getItemsHtmlFn,
    generateSectionTitleHtml,
    generateItemsContainerHtml
} from './sectionUtils';

function renderCombinedSection(
    elem: HTMLElement,
    apiClient: ApiClient,
    user: UserDto,
    parent: BaseItemDto,
    options: SectionOptions,
    sectionType: 'released' | 'added',
    translationKey: string
) {
    const html = generateSectionTitleHtml(parent, translationKey) + generateItemsContainerHtml(options.enableOverflow);
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

        const releasedFrag = document.createElement('div');
        releasedFrag.classList.add('verticalSection', 'hide');
        elem.appendChild(releasedFrag);
        renderCombinedSection(releasedFrag, apiClient, user, item, options, 'released', 'RecentlyReleasedFromLibrary');

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

        const addedFrag = document.createElement('div');
        addedFrag.classList.add('verticalSection', 'hide');
        elem.appendChild(addedFrag);
        renderCombinedSection(addedFrag, apiClient, user, item, options, 'added', 'LatestFromLibrary');

        const releasedFrag = document.createElement('div');
        releasedFrag.classList.add('verticalSection', 'hide');
        elem.appendChild(releasedFrag);
        renderCombinedSection(releasedFrag, apiClient, user, item, options, 'released', 'RecentlyReleasedFromLibrary');
    }
}
