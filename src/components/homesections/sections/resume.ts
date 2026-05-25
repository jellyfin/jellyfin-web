import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import type { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import type { ApiClient } from 'jellyfin-apiclient';

import { getResumeItemsQuery } from 'apps/stable/features/libraries/api/useResumeItems';
import cardBuilder from 'components/cardbuilder/cardBuilder';
import { getBackdropShape, getPortraitShape } from 'components/cardbuilder/utils/shape';
import globalize from 'lib/globalize';
import { queryClient } from 'utils/query/queryClient';
import type { UserSettings } from 'scripts/settings/userSettings';
import { toApi } from 'utils/jellyfin-apiclient/compat';

import type { SectionContainerElement, SectionOptions } from './section';

const dataMonitorHints: Record<string, string> = {
    Audio: 'audioplayback,markplayed',
    Video: 'videoplayback,markplayed'
};

function getItemsToResumeFn(
    apiClient: ApiClient,
    mediaType: MediaType,
    { enableOverflow }: SectionOptions
) {
    return function () {
        const limit = enableOverflow ? 12 : 5;

        const options = {
            userId: apiClient.getCurrentUserId(),
            limit,
            fields: [ ItemFields.PrimaryImageAspectRatio ],
            imageTypeLimit: 1,
            enableImageTypes: [
                ImageType.Primary,
                ImageType.Backdrop,
                ImageType.Thumb
            ],
            enableTotalRecordCount: false,
            mediaTypes: [ mediaType ]
        };

        return queryClient
            .fetchQuery(getResumeItemsQuery(toApi(apiClient), options));
    };
}

function getItemsToResumeHtmlFn(
    useEpisodeImages: boolean,
    mediaType: MediaType,
    { enableOverflow }: SectionOptions
) {
    return function (items: BaseItemDto[]) {
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
    mediaType: MediaType,
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
    itemsContainer.fetchData = getItemsToResumeFn(apiClient, mediaType, options);
    itemsContainer.getItemsHtml = getItemsToResumeHtmlFn(userSettings.useEpisodeImagesInNextUpAndResume(), mediaType, options);
    itemsContainer.parentContainer = elem;
}
