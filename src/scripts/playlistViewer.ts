import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import listView from '../components/listview/listview';
import { ServerConnections } from '../lib/jellyfin-apiclient';
import { toApi } from '../utils/jellyfin-apiclient/compat';

function getFetchPlaylistItemsFn(apiClient: any, itemId: string) {
    return function () {
        const query = {
            Fields: 'PrimaryImageAspectRatio,MediaSourceCount,Chapters,Trickplay',
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
            UserId: apiClient.getCurrentUserId()
        };
        return apiClient.getJSON(apiClient.getUrl(`Playlists/${itemId}/Items`, query));
    };
}

function getItemsHtmlFn(playlistId: string, isEditable = false) {
    return function (items: any[]) {
        return (listView as any).getListViewHtml({
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

async function init(page: HTMLElement, item: any) {
    const apiClient = ServerConnections.getApiClient(item.ServerId);
    const api = toApi(apiClient);

    let isEditable = false;
    try {
        const { data } = await getPlaylistsApi(api).getPlaylistUser({
            playlistId: item.Id,
            userId: apiClient.getCurrentUserId()
        });
        isEditable = !!data.CanEdit;
    } catch (err) {
        console.info('[PlaylistViewer] Failed to fetch playlist permissions', err);
    }

    const elem = page.querySelector('#childrenContent .itemsContainer') as any;
    if (elem) {
        elem.classList.add('vertical-list');
        elem.classList.remove('vertical-wrap');
        elem.enableDragReordering(isEditable);
        elem.fetchData = getFetchPlaylistItemsFn(apiClient, item.Id);
        elem.getItemsHtml = getItemsHtmlFn(item.Id, isEditable);
    }
}

function refresh(page: HTMLElement) {
    page.querySelector('#childrenContent')?.classList.add('verticalSection-extrabottompadding');
    (page.querySelector('#childrenContent .itemsContainer') as any)?.refreshItems();
}

export function render(page: HTMLElement & { playlistInit?: boolean }, item: any): void {
    if (!page.playlistInit) {
        page.playlistInit = true;
        init(page, item).finally(() => refresh(page));
    } else {
        refresh(page);
    }
}

const playlistViewer = { render };
export default playlistViewer;
