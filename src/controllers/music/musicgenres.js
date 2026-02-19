import * as userSettings from '../../scripts/settings/userSettings';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import imageLoader from '../../components/images/imageLoader';
import loading from '../../components/loading/loading';

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
                view: userSettings.getSavedView(key) || 'Poster'
            };
            pageData.query.ParentId = params.topParentId;
            userSettings.loadQuerySettings(key, pageData.query);
        }

        return pageData;
    }

    function getQuery() {
        return getPageData().query;
    }

    function getSavedQueryKey() {
        return `${params.topParentId}-genres`;
    }

    function getPromise() {
        loading.show();
        const query = getQuery();
        return ApiClient.getGenres(ApiClient.getCurrentUserId(), query);
    }

    const reloadItems = (context, promise) => {
        const query = getQuery();
        promise.then((result) => {
            let html = '';
            const viewStyle = this.getCurrentViewStyle();

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
            userSettings.saveQuerySettings(getSavedQueryKey(), query);
            loading.hide();

            import('../../components/autoFocuser').then(({ default: autoFocuser }) => {
                autoFocuser.autoFocus(context);
            });
        });
    };

    function fullyReload() {
        this.preRender();
        this.renderTab();
    }

    const data = {};

    this.getViewStyles = function () {
        return 'Poster,PosterCard,Thumb,ThumbCard'.split(',');
    };

    this.getCurrentViewStyle = function () {
        return getPageData().view;
    };

    this.setCurrentViewStyle = function (viewStyle) {
        getPageData().view = viewStyle;
        userSettings.saveViewSetting(getSavedQueryKey(), viewStyle);
        fullyReload();
    };

    this.enableViewSelection = true;
    let promise;

    this.preRender = function () {
        promise = getPromise();
    };

    this.renderTab = function () {
        reloadItems(tabContent, promise);
    };
}

