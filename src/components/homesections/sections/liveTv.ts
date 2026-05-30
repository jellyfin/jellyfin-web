import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { ApiClient } from 'jellyfin-apiclient';

import { appRouter } from 'components/router/appRouter';
import cardBuilder from 'components/cardbuilder/cardBuilder';
import { getBackdropShape } from 'components/cardbuilder/utils/shape';
import layoutManager from 'components/layoutManager';
import globalize from 'lib/globalize';

import type { SectionContainerElement, SectionOptions } from './section';
import { queryClient } from 'utils/query/queryClient';
import { getRecommendedProgramsQuery } from 'apps/stable/features/liveTv/api/useRecommendedPrograms';
import { toApi } from 'utils/jellyfin-apiclient/compat';

function getOnNowFetchFn(
    apiClient: ApiClient
) {
    return function () {
        return queryClient
            .fetchQuery(getRecommendedProgramsQuery(toApi(apiClient), {
                userId: apiClient.getCurrentUserId(),
                isAiring: true,
                limit: 24,
                imageTypeLimit: 1,
                enableImageTypes: [
                    ImageType.Primary,
                    ImageType.Thumb,
                    ImageType.Backdrop
                ],
                enableTotalRecordCount: false,
                fields: [
                    ItemFields.ChannelInfo,
                    ItemFields.PrimaryImageAspectRatio
                ]
            }));
    };
}

function getOnNowItemsHtmlFn(
    { enableOverflow }: SectionOptions
) {
    return (items: BaseItemDto[]) => (
        cardBuilder.getCardsHtml({
            items: items,
            preferThumb: 'auto',
            inheritThumb: false,
            shape: (enableOverflow ? 'autooverflow' : 'auto'),
            showParentTitleOrTitle: true,
            showTitle: true,
            centerText: true,
            coverImage: true,
            overlayText: false,
            allowBottomPadding: !enableOverflow,
            showAirTime: true,
            showChannelName: false,
            showAirDateTime: false,
            showAirEndTime: true,
            defaultShape: getBackdropShape(enableOverflow),
            lines: 3,
            overlayPlayButton: true
        })
    );
}

function buildSection(
    elem: HTMLElement,
    apiClient: ApiClient,
    options: SectionOptions
) {
    const serverId = apiClient.serverId();

    elem.classList.remove('padded-left');
    elem.classList.remove('padded-right');
    elem.classList.remove('padded-bottom');
    elem.classList.remove('verticalSection');

    let html = '';
    html += '<div class="verticalSection">';
    html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
    html += '<h2 class="sectionTitle sectionTitle-cards">' + globalize.translate('LiveTV') + '</h2>';
    html += '</div>';

    if (options.enableOverflow) {
        html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true" data-scrollbuttons="false">';
        html += '<div class="padded-top padded-bottom scrollSlider focuscontainer-x">';
    } else {
        html += '<div class="padded-top padded-bottom focuscontainer-x">';
    }

    html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl('livetv', {
        serverId,
        section: 'programs'
    }) + '" class="raised"><span>' + globalize.translate('Programs') + '</span></a>';

    html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl('livetv', {
        serverId,
        section: 'guide'
    }) + '" class="raised"><span>' + globalize.translate('Guide') + '</span></a>';

    html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl('livetv', {
        serverId,
        section: 'channels'
    }) + '" class="raised"><span>' + globalize.translate('Channels') + '</span></a>';

    html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl('recordedtv', {
        serverId
    }) + '" class="raised"><span>' + globalize.translate('Recordings') + '</span></a>';

    html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl('livetv', {
        serverId,
        section: 'dvrschedule'
    }) + '" class="raised"><span>' + globalize.translate('Schedule') + '</span></a>';

    html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl('livetv', {
        serverId,
        section: 'seriesrecording'
    }) + '" class="raised"><span>' + globalize.translate('Series') + '</span></a>';

    html += '</div>';
    if (options.enableOverflow) {
        html += '</div>';
    }
    html += '</div>';
    html += '</div>';

    html += '<div class="verticalSection">';
    html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';

    if (!layoutManager.tv) {
        html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl('livetv', {
            serverId,
            section: 'onnow'
        }) + '" class="more button-flat button-flat-mini sectionTitleTextButton">';
        html += '<h2 class="sectionTitle sectionTitle-cards">';
        html += globalize.translate('HeaderOnNow');
        html += '</h2>';
        html += '<span class="material-icons chevron_right" aria-hidden="true"></span>';
        html += '</a>';
    } else {
        html += '<h2 class="sectionTitle sectionTitle-cards">' + globalize.translate('HeaderOnNow') + '</h2>';
    }
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
    html += '</div>';

    elem.innerHTML = html;

    const itemsContainer: SectionContainerElement | null = elem.querySelector('.itemsContainer');
    if (!itemsContainer) return;
    itemsContainer.parentContainer = elem;
    itemsContainer.fetchData = getOnNowFetchFn(apiClient);
    itemsContainer.getItemsHtml = getOnNowItemsHtmlFn(options);
}

export function loadLiveTV(
    elem: HTMLElement,
    apiClient: ApiClient,
    user: UserDto,
    options: SectionOptions
) {
    if (!user.Policy?.EnableLiveTvAccess) {
        return Promise.resolve();
    }

    return queryClient
        .fetchQuery(getRecommendedProgramsQuery(toApi(apiClient), {
            userId: apiClient.getCurrentUserId(),
            isAiring: true,
            limit: 1,
            imageTypeLimit: 1,
            enableImageTypes: [
                ImageType.Primary,
                ImageType.Thumb,
                ImageType.Backdrop
            ],
            enableTotalRecordCount: false,
            fields: [
                ItemFields.ChannelInfo,
                ItemFields.PrimaryImageAspectRatio
            ]
        }))
        .then(programs => {
            if (programs.Items?.length) {
                buildSection(elem, apiClient, options);
            }
        });
}
