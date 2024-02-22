import loading from '../components/loading/loading';
import listView from '../components/listview/listview';
import cardBuilder from '../components/cardbuilder/cardBuilder';
import libraryMenu from './libraryMenu';
import libraryBrowser from './libraryBrowser';
import imageLoader from '../components/images/imageLoader';
import * as userSettings from './settings/userSettings';
import '../elements/emby-itemscontainer/emby-itemscontainer';
import Dashboard from '../utils/dashboard';

export default function (view) {
    function getPageData() {
        const key = getSavedQueryKey();
        let pageData = data[key];

        if (!pageData) {
            pageData = data[key] = {
                query: {
                    SortBy: 'SortName',
                    SortOrder: 'Ascending',
                    IncludeItemTypes: 'Playlist',
                    Recursive: true,
                    Fields: 'PrimaryImageAspectRatio,SortName,CumulativeRunTimeTicks,CanDelete',
                    StartIndex: 0
                },
                view: userSettings.getSavedView(key) || 'Poster'
            };

            if (userSettings.libraryPageSize() > 0) {
                pageData.query['Limit'] = userSettings.libraryPageSize();
            }

            pageData.query.ParentId = libraryMenu.getTopParentId();
            userSettings.loadQuerySettings(key, pageData.query);
        }

        return pageData;
    }

    function getQuery() {
        return getPageData().query;
    }

    function getSavedQueryKey() {
        return `${libraryMenu.getTopParentId()}-playlists`;
    }

    function showLoadingMessage() {
        loading.show();
    }

    function hideLoadingMessage() {
        loading.hide();
    }

    function onViewStyleChange() {
        const viewStyle = getPageData().view;
        const itemsContainer = view.querySelector('.itemsContainer');

        if (viewStyle == 'List') {
            itemsContainer.classList.add('vertical-list');
            itemsContainer.classList.remove('vertical-wrap');
        } else {
            itemsContainer.classList.remove('vertical-list');
            itemsContainer.classList.add('vertical-wrap');
        }

        itemsContainer.innerHTML = '';
    }

    function reloadItems() {
        showLoadingMessage();
        const query = getQuery();
        const promise1 = ApiClient.getItems(Dashboard.getCurrentUserId(), query);
        // TODO: promise2 is unused, check if necessary.
        const promise2 = Dashboard.getCurrentUser();
        Promise.all([promise1, promise2]).then(function (responses) {
            const result = responses[0];
            // TODO: Is the scroll necessary?
            window.scrollTo(0, 0);
            let html = '';
            const viewStyle = getPageData().view;
            view.querySelector('.listTopPaging').innerHTML = libraryBrowser.getQueryPagingHtml({
                startIndex: query.StartIndex,
                limit: query.Limit,
                totalRecordCount: result.TotalRecordCount,
                viewButton: false,
                showLimit: false,
                updatePageSizeSetting: false,
                addLayoutButton: true,
                layouts: 'List,Poster,PosterCard,Thumb,ThumbCard',
                currentLayout: viewStyle
            });

            if (result.TotalRecordCount) {
                if (viewStyle == 'List') {
                    html = listView.getListViewHtml({
                        items: result.Items,
                        sortBy: query.SortBy
                    });
                } else if (viewStyle == 'PosterCard') {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: 'square',
                        coverImage: true,
                        showTitle: true,
                        cardLayout: true
                    });
                } else if (viewStyle == 'Thumb') {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: 'backdrop',
                        showTitle: true,
                        centerText: true,
                        preferThumb: true,
                        overlayPlayButton: true
                    });
                } else if (viewStyle == 'ThumbCard') {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: 'backdrop',
                        showTitle: true,
                        preferThumb: true,
                        cardLayout: true
                    });
                } else {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: 'square',
                        showTitle: true,
                        coverImage: true,
                        centerText: true,
                        overlayPlayButton: true
                    });
                }
                view.querySelector('.noItemsMessage').classList.add('hide');
            } else {
                view.querySelector('.noItemsMessage').classList.remove('hide');
            }

            const elem = view.querySelector('.itemsContainer');
            elem.innerHTML = html;
            imageLoader.lazyChildren(elem);
            const btnNextPage = view.querySelector('.btnNextPage');

            if (btnNextPage) {
                btnNextPage.addEventListener('click', function () {
                    if (userSettings.libraryPageSize() > 0) {
                        query.StartIndex += query.Limit;
                    }
                    reloadItems();
                });
            }

            const btnPreviousPage = view.querySelector('.btnPreviousPage');

            if (btnPreviousPage) {
                btnPreviousPage.addEventListener('click', function () {
                    if (userSettings.libraryPageSize() > 0) {
                        query.StartIndex = Math.max(0, query.StartIndex - query.Limit);
                    }
                    reloadItems();
                });
            }

            const btnChangeLayout = view.querySelector('.btnChangeLayout');

            if (btnChangeLayout) {
                btnChangeLayout.addEventListener('layoutchange', function (e) {
                    const layout = e.detail.viewStyle;
                    getPageData().view = layout;
                    userSettings.saveViewSetting(getSavedQueryKey(), layout);
                    onViewStyleChange();
                    reloadItems();
                });
            }

            userSettings.saveQuerySettings(getSavedQueryKey(), query);
            hideLoadingMessage();
        });
    }

    const data = {};
    view.addEventListener('viewbeforeshow', function () {
        reloadItems();
    });
    view.querySelector('.btnNewPlaylist').addEventListener('click', function () {
        import('../components/playlisteditor/playlisteditor').then(({ default: PlaylistEditor }) => {
            const serverId = ApiClient.serverInfo().Id;
            const playlistEditor = new PlaylistEditor();
            playlistEditor.show({
                items: [],
                serverId: serverId
            }).catch(() => {
                // Dialog closed
            });
        }).catch(err => {
            console.error('[btnNewPlaylist] failed to load playlist editor', err);
        });
    });
    onViewStyleChange();
}

