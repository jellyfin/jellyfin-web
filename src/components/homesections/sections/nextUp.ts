import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { ApiClient } from 'jellyfin-apiclient';

import cardBuilder from 'components/cardbuilder/cardBuilder';
import layoutManager from 'components/layoutManager';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import type { UserSettings } from 'scripts/settings/userSettings';
import { getBackdropShape } from 'utils/card';

import type { SectionContainerElement, SectionOptions } from './section';

function getNextUpFetchFn(
    serverId: string,
    userSettings: UserSettings,
    { enableOverflow }: SectionOptions
) {
    return () => {
        const apiClient = ServerConnections.getApiClient(serverId);
        const oldestDateForNextUp = new Date();
        oldestDateForNextUp.setDate(oldestDateForNextUp.getDate() - userSettings.maxDaysForNextUp());
        return apiClient.getNextUpEpisodes({
            Limit: enableOverflow ? 24 : 15,
            Fields: 'PrimaryImageAspectRatio,DateCreated,Path,MediaSourceCount',
            UserId: apiClient.getCurrentUserId(),
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
            EnableTotalRecordCount: false,
            DisableFirstEpisode: false,
            NextUpDateCutoff: oldestDateForNextUp.toISOString(),
            EnableResumable: false,
            EnableRewatching: userSettings.enableRewatchingInNextUp()
        });
    };
}

function getNextUpItemsHtmlFn(
    useEpisodeImages: boolean,
    { enableOverflow }: SectionOptions
) {
    return (items: BaseItemDto[]) => {
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
            overlayPlayButton: true,
            context: 'home',
            centerText: !cardLayout,
            allowBottomPadding: !enableOverflow,
            cardLayout: cardLayout
        });
    };
}

export function loadNextUp(
    elem: HTMLElement,
    apiClient: ApiClient,
    userSettings: UserSettings,
    options: SectionOptions
) {
    let html = '';

    html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
    if (!layoutManager.tv) {
        html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl('nextup', {
            serverId: apiClient.serverId()
        }) + '" class="button-flat button-flat-mini sectionTitleTextButton">';
        html += '<h2 class="sectionTitle sectionTitle-cards">';
        html += globalize.translate('NextUp');
        html += '</h2>';
        html += '<span class="material-icons chevron_right" aria-hidden="true"></span>';
        html += '</a>';
    } else {
        html += '<h2 class="sectionTitle sectionTitle-cards">';
        html += globalize.translate('NextUp');
        html += '</h2>';
    }
    html += '</div>';

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
    itemsContainer.fetchData = getNextUpFetchFn(apiClient.serverId(), userSettings, options);
    itemsContainer.getItemsHtml = getNextUpItemsHtmlFn(userSettings.useEpisodeImagesInNextUpAndResume(), options);
    itemsContainer.parentContainer = elem;
}
