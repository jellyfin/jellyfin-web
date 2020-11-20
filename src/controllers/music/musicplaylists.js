import libraryBrowser from '../../scripts/libraryBrowser';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import imageLoader from '../../components/images/imageLoader';
import loading from '../../components/loading/loading';

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
                        IncludeItemTypes: 'Playlist',
                        Recursive: true,
                        Fields: 'PrimaryImageAspectRatio,SortName,CanDelete',
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
            return ApiClient.getItems(ApiClient.getCurrentUserId(), query);
        }

        function reloadItems(context, promise) {
            const query = getQuery();
            promise.then(function (result) {
                let html = '';
                html = cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: 'square',
                    showTitle: true,
                    coverImage: true,
                    centerText: true,
                    overlayPlayButton: true,
                    allowBottomPadding: true,
                    cardLayout: false
                });
                const elem = context.querySelector('#items');
                elem.innerHTML = html;
                imageLoader.lazyChildren(elem);
                libraryBrowser.saveQueryValues(getSavedQueryKey(), query);
                loading.hide();

                import('../../components/autoFocuser').then(({default: autoFocuser}) => {
                    autoFocuser.autoFocus(context);
                });
            });
        }

        const data = {};

        this.getCurrentViewStyle = function () {
            return getPageData().view;
        };

        let promise;

        this.preRender = function () {
            promise = getPromise();
        };

        this.renderTab = function () {
            reloadItems(tabContent, promise);
        };
    }

/* eslint-enable indent */
