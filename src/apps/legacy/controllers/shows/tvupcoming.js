import { isYesterday } from 'date-fns';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';

import { getUpcomingEpisodesQuery } from '@/apps/modern/features/libraries/hooks/api/useUpcomingEpisodes';
import cardBuilder from 'components/cardbuilder/cardBuilder';
import { getBackdropShape } from 'components/cardbuilder/utils/shape';
import imageLoader from 'components/images/imageLoader';
import layoutManager from 'components/layoutManager';
import loading from 'components/loading/loading';
import datetime from 'scripts/datetime';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { queryClient } from '@/utils/query/queryClient';

import 'elements/emby-itemscontainer/emby-itemscontainer';

import 'styles/scrollstyles.scss';

function getUpcomingPromise(context, params) {
    loading.show();
    const api = ServerConnections.getApi();
    const userId = ServerConnections.currentApiClient().getCurrentUserId();

    return queryClient.query(getUpcomingEpisodesQuery(api, {
        userId,
        parentId: params.topParentId,
        limit: 48,
        fields: [ItemFields.AirTime],
        imageTypeLimit: 1,
        enableImageTypes: [ImageType.Primary, ImageType.Backdrop, ImageType.Banner, ImageType.Thumb]
    }));
}

function loadUpcoming(context, params, promise) {
    promise.then(items => {
        if (items.length) {
            context.querySelector('.noItemsMessage').style.display = 'none';
        } else {
            context.querySelector('.noItemsMessage').style.display = 'block';
        }

        renderUpcoming(context.querySelector('#upcomingItems'), items);
        loading.hide();
    });
}

function enableScrollX() {
    return !layoutManager.desktop;
}

function renderUpcoming(elem, items) {
    const groups = [];
    let currentGroupName;
    let currentGroup = [];

    for (let i = 0, length = items.length; i < length; i++) {
        const item = items[i];
        let dateText = '';

        if (item.PremiereDate) {
            try {
                const premiereDate = datetime.parseISO8601Date(item.PremiereDate, true);
                dateText = isYesterday(premiereDate) ? globalize.translate('Yesterday') : datetime.toLocaleDateString(premiereDate, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (err) {
                console.error('error parsing timestamp for upcoming tv shows', err);
            }
        }

        if (dateText != currentGroupName) {
            currentGroupName = dateText;
            currentGroup = [item];

            groups.push({
                name: currentGroupName,
                items: currentGroup
            });
        } else {
            currentGroup.push(item);
        }
    }

    let html = '';

    for (let i = 0, length = groups.length; i < length; i++) {
        const group = groups[i];
        html += '<div class="verticalSection">';
        html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + group.name + '</h2>';
        let allowBottomPadding = true;

        if (enableScrollX()) {
            allowBottomPadding = false;
            let scrollXClass = 'scrollX hiddenScrollX';

            if (layoutManager.tv) {
                scrollXClass += ' smoothScrollX';
            }

            html += '<div is="emby-itemscontainer" class="itemsContainer ' + scrollXClass + ' padded-left padded-right">';
        } else {
            html += '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap padded-left padded-right">';
        }

        html += cardBuilder.getCardsHtml({
            items: group.items,
            showLocationTypeIndicator: false,
            shape: getBackdropShape(enableScrollX()),
            showTitle: true,
            preferThumb: true,
            lazy: true,
            showDetailsMenu: true,
            centerText: true,
            showParentTitle: true,
            overlayText: false,
            allowBottomPadding: allowBottomPadding,
            cardLayout: false,
            overlayMoreButton: true,
            missingIndicator: false
        });
        html += '</div>';
        html += '</div>';
    }

    elem.innerHTML = html;
    imageLoader.lazyChildren(elem);
}

export default function (view, params, tabContent) {
    let upcomingPromise;
    const self = this;

    self.preRender = function () {
        upcomingPromise = getUpcomingPromise(view, params);
    };

    self.renderTab = function () {
        loadUpcoming(tabContent, params, upcomingPromise);
    };
}
