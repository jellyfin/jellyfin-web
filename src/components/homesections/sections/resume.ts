import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { ApiClient } from 'jellyfin-apiclient';

import cardBuilder from 'components/cardbuilder/cardBuilder';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import type { UserSettings } from 'scripts/settings/userSettings';
import { getBackdropShape, getPortraitShape } from 'utils/card';

import type { SectionContainerElement, SectionOptions } from './section';

const dataMonitorHints: Record<string, string> = {
    Audio: 'audioplayback,markplayed',
    Video: 'videoplayback,markplayed'
};

function getItemsToResumeFn(
    mediaType: BaseItemKind,
    serverId: string,
    { enableOverflow }: SectionOptions
) {
    return () => {
        const apiClient = ServerConnections.getApiClient(serverId);

        const limit = enableOverflow ? 12 : 5;

        const options = {
            Limit: limit,
            Recursive: true,
            Fields: 'PrimaryImageAspectRatio',
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Thumb',
            EnableTotalRecordCount: false,
            MediaTypes: mediaType
        };

        return apiClient.getResumableItems(apiClient.getCurrentUserId(), options);
    };
}

function getItemsToResumeHtmlFn(
    useEpisodeImages: boolean,
    mediaType: BaseItemKind,
    { enableOverflow }: SectionOptions
) {
    return (items: BaseItemDto[]) => {
        const cardLayout = false;
        return cardBuilder.getCardsHtml({
            items: items,
            preferThumb: true,
            inheritThumb: !useEpisodeImages,
            shape: (mediaType === 'Book') ?
                getPortraitShape(enableOverflow) :
                getBackdropShape(enableOverflow),
            overlayText: false,
            showTitle: true,
            showParentTitle: true,
            lazy: true,
            showDetailsMenu: true,
            overlayPlayButton: true,
            context: 'home',
            centerText: !cardLayout,
            allowBottomPadding: false,
            cardLayout: cardLayout,
            showYear: true,
            lines: 2
        });
    };
}

export function loadResume(
    elem: HTMLElement,
    apiClient: ApiClient,
    titleLabel: string,
    mediaType: BaseItemKind,
    userSettings: UserSettings,
    options: SectionOptions
) {
    let html = '';

    const dataMonitor = dataMonitorHints[mediaType] ?? 'markplayed';

    html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate(titleLabel) + '</h2>';
    if (options.enableOverflow) {
        html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
        html += `<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x" data-monitor="${dataMonitor}">`;
    } else {
        html += `<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x" data-monitor="${dataMonitor}">`;
    }

    if (options.enableOverflow) {
        html += '</div>';
    }
    html += '</div>';

    elem.classList.add('hide');
    elem.innerHTML = html;

    const itemsContainer: SectionContainerElement | null = elem.querySelector('.itemsContainer');
    if (!itemsContainer) return;
    itemsContainer.fetchData = getItemsToResumeFn(mediaType, apiClient.serverId(), options);
    itemsContainer.getItemsHtml = getItemsToResumeHtmlFn(userSettings.useEpisodeImagesInNextUpAndResume(), mediaType, options);
    itemsContainer.parentContainer = elem;
}
