import libraryBrowser from 'libraryBrowser';
import cardBuilder from 'cardBuilder';
import imageLoader from 'imageLoader';
import loading from 'loading';

libraryBrowser = libraryBrowser.default || libraryBrowser;

/* eslint-disable indent */

    export default function (view, params, tabContent) {
        function getPageData() {
            const key = getSavedQueryKey();
            let pageData = data[key];

            if (!pageData) {
                pageData = data[key] = {
                    query: {
                        SortBy: 'SortName',
                        SortOrder: 'Ascending',
                        Recursive: true,
                        Fields: 'PrimaryImageAspectRatio,ItemCounts',
                        StartIndex: 0
                    },
                    view: libraryBrowser.getSavedView(key) || 'Poster'
                };
                pageData.query.ParentId = params.topParentId;
                libraryBrowser.loadSavedQueryValues(key, pageData.query);
            }

            return pageData;
        }

        function getQuery() {
            return getPageData().query;
        }

        function getSavedQueryKey() {
            return libraryBrowser.getSavedQueryKey('genres');
        }

        function getPromise() {
            loading.show();
            const query = getQuery();
            return ApiClient.getGenres(ApiClient.getCurrentUserId(), query);
        }

        function reloadItems(context, promise) {
            const query = getQuery();
            promise.then(function (result) {
                let html = '';
                const viewStyle = self.getCurrentViewStyle();

                if (viewStyle == 'Thumb') {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: 'backdrop',
                        preferThumb: true,
                        context: 'music',
                        centerText: true,
                        overlayMoreButton: true,
                        showTitle: true
                    });
                } else if (viewStyle == 'ThumbCard') {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: 'backdrop',
                        preferThumb: true,
                        context: 'music',
                        cardLayout: true,
                        showTitle: true
                    });
                } else if (viewStyle == 'PosterCard') {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: 'auto',
                        context: 'music',
                        cardLayout: true,
                        showTitle: true
                    });
                } else if (viewStyle == 'Poster') {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: 'auto',
                        context: 'music',
                        centerText: true,
                        overlayMoreButton: true,
                        showTitle: true
                    });
                }

                const elem = context.querySelector('#items');
                elem.innerHTML = html;
                imageLoader.lazyChildren(elem);
                libraryBrowser.saveQueryValues(getSavedQueryKey(), query);
                loading.hide();

                import('autoFocuser').then(({default: autoFocuser}) => {
                    autoFocuser.autoFocus(context);
                });
            });
        }

        function fullyReload() {
            self.preRender();
            self.renderTab();
        }

        const self = this;
        const data = {};

        self.getViewStyles = function () {
            return 'Poster,PosterCard,Thumb,ThumbCard'.split(',');
        };

        self.getCurrentViewStyle = function () {
            return getPageData().view;
        };

        self.setCurrentViewStyle = function (viewStyle) {
            getPageData().view = viewStyle;
            libraryBrowser.saveViewSetting(getSavedQueryKey(), viewStyle);
            fullyReload();
        };

        self.enableViewSelection = true;
        let promise;

        self.preRender = function () {
            promise = getPromise();
        };

        self.renderTab = function () {
            reloadItems(tabContent, promise);
        };
    }

/* eslint-enable indent */
