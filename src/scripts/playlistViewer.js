import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';

import listView from 'components/listview/listview';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { toApi } from 'utils/jellyfin-apiclient/compat';

function getFetchPlaylistItemsFn(apiClient, itemId) {
    return function () {
        const query = {
            Fields: 'PrimaryImageAspectRatio,MediaSourceCount,Chapters,Trickplay',
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
            UserId: apiClient.getCurrentUserId()
        };
        return apiClient.getJSON(apiClient.getUrl(`Playlists/${itemId}/Items`, query));
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
    const apiClient = ServerConnections.getApiClient(item.ServerId);
    const api = toApi(apiClient);

    let isEditable = false;
    const { data } = await getPlaylistsApi(api)
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
    elem.fetchData = getFetchPlaylistItemsFn(apiClient, item.Id);
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
