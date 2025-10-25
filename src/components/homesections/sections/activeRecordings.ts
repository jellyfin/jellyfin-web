import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { ApiClient } from 'jellyfin-apiclient';

import cardBuilder from 'components/cardbuilder/cardBuilder';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';

import type { SectionContainerElement, SectionOptions } from './section';

function getLatestRecordingsFetchFn(
    serverId: string,
    activeRecordingsOnly: boolean,
    { enableOverflow }: SectionOptions
) {
    return () => {
        const apiClient = ServerConnections.getApiClient(serverId);
        return apiClient.getLiveTvRecordings({
            userId: apiClient.getCurrentUserId(),
            Limit: enableOverflow ? 12 : 5,
            Fields: 'PrimaryImageAspectRatio',
            EnableTotalRecordCount: false,
            IsLibraryItem: activeRecordingsOnly ? null : false,
            IsInProgress: activeRecordingsOnly ? true : null
        });
    };
}

function getLatestRecordingItemsHtml(
    activeRecordingsOnly: boolean,
    { enableOverflow }: SectionOptions
) {
    return (items: BaseItemDto[]) => cardBuilder.getCardsHtml({
        items: items,
        shape: enableOverflow ? 'autooverflow' : 'auto',
        showTitle: true,
        showParentTitle: true,
        coverImage: true,
        lazy: true,
        showDetailsMenu: true,
        centerText: true,
        overlayText: false,
        showYear: true,
        lines: 2,
        overlayPlayButton: !activeRecordingsOnly,
        allowBottomPadding: !enableOverflow,
        preferThumb: true,
        cardLayout: false,
        overlayMoreButton: activeRecordingsOnly,
        action: activeRecordingsOnly ? 'none' : null,
        centerPlayButton: activeRecordingsOnly
    });
}

export function loadRecordings(
    elem: HTMLElement,
    activeRecordingsOnly: boolean,
    apiClient: ApiClient,
    options: SectionOptions
) {
    const title = activeRecordingsOnly ?
        globalize.translate('HeaderActiveRecordings') :
        globalize.translate('HeaderLatestRecordings');

    let html = '';

    html += '<div class="sectionTitleContainer sectionTitleContainer-cards">';
    html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + title + '</h2>';
    html += '</div>';

    if (options.enableOverflow) {
        html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
        html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x">';
    } else {
        html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x">';
    }

    if (options.enableOverflow) {
        html += '</div>';
    }
    html += '</div>';

    elem.classList.add('hide');
    elem.innerHTML = html;

    const itemsContainer: SectionContainerElement | null = elem.querySelector('.itemsContainer');
    if (!itemsContainer) return;
    itemsContainer.fetchData = getLatestRecordingsFetchFn(apiClient.serverId(), activeRecordingsOnly, options);
    itemsContainer.getItemsHtml = getLatestRecordingItemsHtml(activeRecordingsOnly, options);
    itemsContainer.parentContainer = elem;
}
