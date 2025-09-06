import cardBuilder from '../../components/cardbuilder/cardBuilder';
import imageLoader from '../../components/images/imageLoader';
import libraryBrowser from '../../scripts/libraryBrowser';
import loading from '../../components/loading/loading';
import * as userSettings from '../../scripts/settings/userSettings';
import Events from '../../utils/events.ts';
import { setFilterStatus } from 'components/filterdialog/filterIndicator';

import '../../elements/emby-itemscontainer/emby-itemscontainer';

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
            reloadItems(context).then(() => {
                window.scrollTo(0, 0);
            });
        }

        function onPreviousPageClick() {
            if (isLoading) {
                return;
            }

            if (userSettings.libraryPageSize() > 0) {
                query.StartIndex = Math.max(0, query.StartIndex - query.Limit);
            }
            reloadItems(context).then(() => {
                window.scrollTo(0, 0);
            });
        }

        const query = getQuery();

        for (const elem of context.querySelectorAll('.paging')) {
            elem.innerHTML = libraryBrowser.getQueryPagingHtml({
                startIndex: query.StartIndex,
                limit: query.Limit,
                totalRecordCount: result.TotalRecordCount,
                showLimit: false,
                updatePageSizeSetting: false,
                filterButton: false
            });
        }

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
        import('../../components/filterdialog/filterdialog').then(({ default: FilterDialog }) => {
            const filterDialog = new FilterDialog({
                query: getQuery(),
                mode: 'livetvchannels',
                serverId: ApiClient.serverId()
            });
            Events.on(filterDialog, 'filterchange', () => {
                reloadItems(context);
            });
            filterDialog.show();
        });
    }

    function reloadItems(context) {
        loading.show();
        isLoading = true;
        const query = getQuery();
        setFilterStatus(context, query);

        const apiClient = ApiClient;
        query.UserId = apiClient.getCurrentUserId();
        return apiClient.getLiveTvChannels(query).then((result) => {
            renderChannels(context, result);
            loading.hide();
            isLoading = false;

            import('../../components/autoFocuser').then(({ default: autoFocuser }) => {
                autoFocuser.autoFocus(context);
            });
        });
    }

    let pageData;
    const self = this;
    let isLoading = false;
    tabContent.querySelector('.btnFilter').addEventListener('click', () => {
        showFilterMenu(tabContent);
    });

    self.renderTab = () => {
        reloadItems(tabContent);
    };
}
