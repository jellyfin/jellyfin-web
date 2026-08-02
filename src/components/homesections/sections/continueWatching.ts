import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import type { ApiClient } from 'jellyfin-apiclient';

import { getNextUpQuery } from 'apps/legacy/features/libraries/api/useNextUp';
import { getResumeItemsQuery } from 'apps/legacy/features/libraries/api/useResumeItems';
import cardBuilder from 'components/cardbuilder/cardBuilder';
import { getBackdropShape } from 'components/cardbuilder/utils/shape';
import globalize from 'lib/globalize';
import ServerConnections from 'lib/jellyfin-apiclient/ServerConnections';
import type { UserSettings } from 'scripts/settings/userSettings';
import { toIsoDateOnlyString } from 'utils/date';
import { queryClient } from 'utils/query/queryClient';

import type { SectionContainerElement, SectionOptions } from './section';

function getItemsFn(
    apiClient: ApiClient,
    userSettings: UserSettings,
    { enableOverflow }: SectionOptions
) {
    return function () {
        const api = ServerConnections.getApi(apiClient.serverId());
        const userId = apiClient.getCurrentUserId();
        const limit = enableOverflow ? 12 : 5;
        const oldestDateForNextUp = new Date();
        oldestDateForNextUp.setDate(oldestDateForNextUp.getDate() - userSettings.maxDaysForNextUp());

        const resumeItems = queryClient.fetchQuery(getResumeItemsQuery(api, {
            userId,
            limit,
            fields: [ ItemFields.PrimaryImageAspectRatio ],
            imageTypeLimit: 1,
            enableImageTypes: [
                ImageType.Primary,
                ImageType.Backdrop,
                ImageType.Thumb
            ],
            enableTotalRecordCount: false,
            mediaTypes: [ 'Video' ]
        }));

        // Requesting Next Up without resumable episodes makes it exactly complementary
        // to the resume list: a series whose next episode is partially watched surfaces
        // in the resume part instead, so concatenating both never produces duplicates.
        const nextUpItems = queryClient.fetchQuery(getNextUpQuery(api, {
            userId,
            limit,
            fields: [
                ItemFields.PrimaryImageAspectRatio,
                ItemFields.DateCreated,
                ItemFields.Path,
                ItemFields.MediaSourceCount
            ],
            imageTypeLimit: 1,
            enableImageTypes: [
                ImageType.Primary,
                ImageType.Backdrop,
                ImageType.Thumb
            ],
            enableTotalRecordCount: false,
            nextUpDateCutoff: toIsoDateOnlyString(oldestDateForNextUp),
            enableResumable: false,
            enableRewatching: userSettings.enableRewatchingInNextUp()
        }));

        return Promise.all([ resumeItems, nextUpItems ])
            .then(([ resumeResult, nextUpResult ]) => ({
                Items: [
                    ...(resumeResult.Items ?? []),
                    ...(nextUpResult.Items ?? [])
                ]
            }));
    };
}

function getItemsHtmlFn(
    useEpisodeImages: boolean,
    { enableOverflow }: SectionOptions
) {
    return function (items: BaseItemDto[]) {
        const cardLayout = false;
        return cardBuilder.getCardsHtml({
            items: items,
            preferThumb: true,
            inheritThumb: !useEpisodeImages,
            shape: getBackdropShape(enableOverflow),
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

export function loadContinueWatching(
    elem: HTMLElement,
    apiClient: ApiClient,
    userSettings: UserSettings,
    options: SectionOptions
) {
    let html = '';

    html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate('HeaderContinueWatchingAndNextUp') + '</h2>';
    if (options.enableOverflow) {
        html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
        html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x" data-monitor="videoplayback,markplayed">';
    } else {
        html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x" data-monitor="videoplayback,markplayed">';
    }

    if (options.enableOverflow) {
        html += '</div>';
    }
    html += '</div>';

    elem.classList.add('hide');
    elem.innerHTML = html;

    const itemsContainer: SectionContainerElement | null = elem.querySelector('.itemsContainer');
    if (!itemsContainer) return;
    itemsContainer.fetchData = getItemsFn(apiClient, userSettings, options);
    itemsContainer.getItemsHtml = getItemsHtmlFn(userSettings.useEpisodeImagesInNextUpAndResume(), options);
    itemsContainer.parentContainer = elem;
}
