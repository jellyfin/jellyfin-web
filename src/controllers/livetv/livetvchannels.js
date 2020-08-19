import cardBuilder from 'cardBuilder';
import imageLoader from 'imageLoader';
import libraryBrowser from 'libraryBrowser';
import loading from 'loading';
import events from 'events';
import * as userSettings from 'userSettings';
import 'emby-itemscontainer';

export default function (view, params, tabContent) {
    function getPageData() {
        if (!pageData) {
            pageData = {
                query: {
                    StartIndex: 0,
                    Fields: 'PrimaryImageAspectRatio'
                }
            };
        }

        if (userSettings.libraryPageSize() > 0) {
            pageData.query['Limit'] = userSettings.libraryPageSize();
        }

        return pageData;
    }

    function getQuery() {
        return getPageData().query;
    }

    function getChannelsHtml(channels) {
        return cardBuilder.getCardsHtml({
            items: channels,
            shape: 'square',
            showTitle: true,
            lazy: true,
            cardLayout: true,
            showDetailsMenu: true,
            showCurrentProgram: true,
            showCurrentProgramTime: true
        });
    }

    function renderChannels(context, result) {
        function onNextPageClick() {
            if (isLoading) {
                return;
            }

            if (userSettings.libraryPageSize() > 0) {
                query.StartIndex += query.Limit;
            }
            reloadItems(context);
        }

        function onPreviousPageClick() {
            if (isLoading) {
                return;
            }

            if (userSettings.libraryPageSize() > 0) {
                query.StartIndex = Math.max(0, query.StartIndex - query.Limit);
            }
            reloadItems(context);
        }

        const query = getQuery();
        context.querySelector('.paging').innerHTML = libraryBrowser.getQueryPagingHtml({
            startIndex: query.StartIndex,
            limit: query.Limit,
            totalRecordCount: result.TotalRecordCount,
            showLimit: false,
            updatePageSizeSetting: false,
            filterButton: false
        });
        const html = getChannelsHtml(result.Items);
        const elem = context.querySelector('#items');
        elem.innerHTML = html;
        imageLoader.lazyChildren(elem);
        let i;
        let length;
        let elems;

        for (elems = context.querySelectorAll('.btnNextPage'), i = 0, length = elems.length; i < length; i++) {
            elems[i].addEventListener('click', onNextPageClick);
        }

        for (elems = context.querySelectorAll('.btnPreviousPage'), i = 0, length = elems.length; i < length; i++) {
            elems[i].addEventListener('click', onPreviousPageClick);
        }
    }

    function showFilterMenu(context) {
        import(['components/filterdialog/filterdialog']).then(({default: FilterDialog}) => {
            const filterDialog = new FilterDialog({
                query: getQuery(),
                mode: 'livetvchannels',
                serverId: ApiClient.serverId()
            });
            events.on(filterDialog, 'filterchange', function () {
                reloadItems(context);
            });
            filterDialog.show();
        });
    }

    function reloadItems(context, save) {
        loading.show();
        isLoading = true;
        const query = getQuery();
        const apiClient = ApiClient;
        query.UserId = apiClient.getCurrentUserId();
        apiClient.getLiveTvChannels(query).then(function (result) {
            renderChannels(context, result);
            loading.hide();
            isLoading = false;

            import('autoFocuser').then(({default: autoFocuser}) => {
                autoFocuser.autoFocus(view);
            });
        });
    }

    let pageData;
    const self = this;
    let isLoading = false;
    tabContent.querySelector('.btnFilter').addEventListener('click', function () {
        showFilterMenu(tabContent);
    });

    self.renderTab = function () {
        reloadItems(tabContent);
    };
}
