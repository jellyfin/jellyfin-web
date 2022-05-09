import listView from '../components/listview/listview';

function getFetchPlaylistItemsFn(itemId) {
    return function () {
        const query = {
            Fields: 'PrimaryImageAspectRatio',
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
            UserId: ApiClient.getCurrentUserId()
        };
        return ApiClient.getJSON(ApiClient.getUrl(`Playlists/${itemId}/Items`, query));
    };
}

function getItemsHtmlFn(itemId) {
    return function (items) {
        return listView.getListViewHtml({
            items: items,
            showIndex: false,
            showRemoveFromPlaylist: true,
            playFromHere: true,
            action: 'playallfromhere',
            smallIcon: true,
            dragHandle: true,
            playlistId: itemId
        });
    };
}

function init(page, item) {
    const elem = page.querySelector('#childrenContent .itemsContainer');
    elem.classList.add('vertical-list');
    elem.classList.remove('vertical-wrap');
    elem.enableDragReordering(true);
    elem.fetchData = getFetchPlaylistItemsFn(item.Id);
    elem.getItemsHtml = getItemsHtmlFn(item.Id);
}

function render(page, item) {
    if (!page.playlistInit) {
        page.playlistInit = true;
        init(page, item);
    }

    page.querySelector('#childrenContent').classList.add('verticalSection-extrabottompadding');
    page.querySelector('#childrenContent .itemsContainer').refreshItems();
}

const PlaylistViewer = {
    render
};

export default PlaylistViewer;
