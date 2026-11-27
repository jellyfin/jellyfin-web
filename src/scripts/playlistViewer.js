import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { getPlaylistApi } from '@jellyfin/sdk/lib/utils/api/playlist-api';

import listView from 'components/listview/listview';
import { ServerConnections } from 'lib/jellyfin-apiclient';

function getFetchPlaylistItemsFn(item) {
    const api = ServerConnections.getApi(item.ServerId);
    return async function () {
        const { data } = await getPlaylistApi(api).getPlaylistItems({
            playlistId: item.Id,
            fields: [
                ItemFields.PrimaryImageAspectRatio,
                ItemFields.MediaSourceCount,
                ItemFields.Chapters,
                ItemFields.Trickplay
            ],
            enableImageTypes: [
                ImageType.Primary,
                ImageType.Backdrop,
                ImageType.Banner,
                ImageType.Thumb
            ]
        });
        return data;
    };
}

function getItemsHtmlFn(playlistId, isEditable = false) {
    return function (items) {
        return listView.getListViewHtml({
            items,
            showIndex: false,
            playFromHere: true,
            action: 'playallfromhere',
            smallIcon: true,
            dragHandle: isEditable,
            playlistId,
            showParentTitle: true
        });
    };
}

async function init(page, item) {
    const api = ServerConnections.getApi(item.ServerId);
    const apiClient = ServerConnections.getApiClient(item.ServerId);

    if (!api || !apiClient) {
        console.error('[PlaylistViewer] No Api or ApiClient instance is available', { api, apiClient });
        return;
    }

    let isEditable = false;
    const { data } = await getPlaylistApi(api)
        .getPlaylistUser({
            playlistId: item.Id,
            userId: apiClient.getCurrentUserId()
        })
        .catch(err => {
            // If a user doesn't have access, then the request will 404 and throw
            console.info('[PlaylistViewer] Failed to fetch playlist permissions', err);
            return { data: {} };
        });
    isEditable = !!data.CanEdit;

    const elem = page.querySelector('#childrenContent .itemsContainer');
    elem.classList.add('vertical-list');
    elem.classList.remove('vertical-wrap');
    elem.enableDragReordering(isEditable);
    elem.fetchData = getFetchPlaylistItemsFn(item);
    elem.getItemsHtml = getItemsHtmlFn(item.Id, isEditable);
}

function refresh(page) {
    page.querySelector('#childrenContent').classList.add('verticalSection-extrabottompadding');
    page.querySelector('#childrenContent .itemsContainer').refreshItems();
}

function render(page, item) {
    if (!page.playlistInit) {
        page.playlistInit = true;
        init(page, item)
            .finally(() => {
                refresh(page);
            });
    } else {
        refresh(page);
    }
}

const PlaylistViewer = {
    render
};

export default PlaylistViewer;
