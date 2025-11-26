import loading from '../../components/loading/loading';
import cardBuilder from '../../components/cardbuilder/cardBuilder';

export function createStudiosController(itemType, context, keySuffix) {
    const data = {};

    function getQuery(params) {
        const key = getSavedQueryKey(params);
        let pageData = data[key];

        if (!pageData) {
            pageData = data[key] = {
                query: {
                    SortBy: 'SortName',
                    SortOrder: 'Ascending',
                    IncludeItemTypes: itemType,
                    Recursive: true,
                    Fields: 'DateCreated,PrimaryImageAspectRatio',
                    StartIndex: 0
                }
            };
            pageData.query.ParentId = params.topParentId;
        }

        return pageData.query;
    }

    function getSavedQueryKey(params) {
        return `${params.topParentId}-${keySuffix}`;
    }

    function getPromise(view, params) {
        const query = getQuery(params);
        loading.show();
        return ApiClient.getStudios(ApiClient.getCurrentUserId(), query);
    }

    function reloadItems(tabContent, params, promise) {
        promise.then(function (result) {
            const elem = tabContent.querySelector('#studioItems');
            cardBuilder.buildCards(result.Items, {
                itemsContainer: elem,
                shape: 'backdrop',
                preferThumb: true,
                showTitle: true,
                scalable: true,
                centerText: true,
                overlayMoreButton: true,
                context: context
            });
            loading.hide();

            import('../../components/autoFocuser').then(({ default: autoFocuser }) => {
                autoFocuser.autoFocus(tabContent);
            });
        });
    }

    function StudiosController(view, params, tabContent) {
        let promise;

        this.preRender = function () {
            promise = getPromise(view, params);
        };

        this.renderTab = function () {
            reloadItems(tabContent, params, promise);
        };
    }

    return StudiosController;
}

