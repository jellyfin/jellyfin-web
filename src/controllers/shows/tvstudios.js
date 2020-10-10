import loading from 'loading';
import libraryBrowser from 'libraryBrowser';
import cardBuilder from 'cardBuilder';

/* eslint-disable indent */

    function getQuery(params) {
        const key = getSavedQueryKey();
        let pageData = data[key];

        if (!pageData) {
            pageData = data[key] = {
                query: {
                    SortBy: 'SortName',
                    SortOrder: 'Ascending',
                    IncludeItemTypes: 'Series',
                    Recursive: true,
                    Fields: 'DateCreated,PrimaryImageAspectRatio',
                    StartIndex: 0
                }
            };
            pageData.query.ParentId = params.topParentId;
        }

        return pageData.query;
    }

    function getSavedQueryKey() {
        return libraryBrowser.getSavedQueryKey('studios');
    }

    function getPromise(context, params) {
        const query = getQuery(params);
        loading.show();
        return ApiClient.getStudios(ApiClient.getCurrentUserId(), query);
    }

    function reloadItems(context, params, promise) {
        promise.then(function (result) {
            const elem = context.querySelector('#items');
            cardBuilder.buildCards(result.Items, {
                itemsContainer: elem,
                shape: 'backdrop',
                preferThumb: true,
                showTitle: true,
                scalable: true,
                centerText: true,
                overlayMoreButton: true,
                context: 'tvshows'
            });
            loading.hide();

            import('autoFocuser').then(({default: autoFocuser}) => {
                autoFocuser.autoFocus(context);
            });
        });
    }

    const data = {};

    export default function (view, params, tabContent) {
        let promise;
        const self = this;

        self.preRender = function () {
            promise = getPromise(view, params);
        };

        self.renderTab = function () {
            reloadItems(tabContent, params, promise);
        };
    }

/* eslint-enable indent */
