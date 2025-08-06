import escapeHtml from 'escape-html';

import cardBuilder from 'components/cardbuilder/cardBuilder';
import lazyLoader from 'components/lazyLoader/lazyLoaderIntersectionObserver';
import layoutManager from 'components/layoutManager';
import loading from 'components/loading/loading';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';
import * as userSettings from 'scripts/settings/userSettings';
import { getBackdropShape, getPortraitShape } from 'utils/card';

import 'elements/emby-button/emby-button';

export default function (view, params, tabContent) {
    function getPageData() {
        const key = getSavedQueryKey();
        let pageData = data[key];

        if (!pageData) {
            pageData = data[key] = {
                query: {
                    SortBy: 'SortName',
                    SortOrder: 'Ascending',
                    IncludeItemTypes: 'Series',
                    Recursive: true,
                    EnableTotalRecordCount: false
                },
                view: 'Poster'
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
        return `${params.topParentId}-seriesgenres`;
    }

    function getPromise() {
        loading.show();
        const query = getQuery();
        return ApiClient.getGenres(ApiClient.getCurrentUserId(), query);
    }

    function enableScrollX() {
        return !layoutManager.desktop;
    }

    function fillItemsContainer(entry, observer) {
        if (!entry.isIntersecting) {
            return;
        }

        const elem = entry.target;
        observer.unobserve(elem);

        const id = elem.getAttribute('data-id');
        const viewStyle = self.getCurrentViewStyle();
        let limit = viewStyle === 'Thumb' || viewStyle === 'ThumbCard' ? 5 : 9;

        if (enableScrollX()) {
            limit = 10;
        }

        const enableImageTypes = viewStyle === 'Thumb' || viewStyle === 'ThumbCard' ? 'Primary,Backdrop,Thumb' : 'Primary';
        const query = {
            SortBy: 'Random',
            SortOrder: 'Ascending',
            IncludeItemTypes: 'Series',
            Recursive: true,
            Fields: 'PrimaryImageAspectRatio,MediaSourceCount',
            ImageTypeLimit: 1,
            EnableImageTypes: enableImageTypes,
            Limit: limit,
            GenreIds: id,
            EnableTotalRecordCount: false,
            ParentId: params.topParentId
        };
        ApiClient.getItems(ApiClient.getCurrentUserId(), query).then(function (result) {
            if (viewStyle === 'Thumb') {
                cardBuilder.buildCards(result.Items, {
                    itemsContainer: elem,
                    shape: getBackdropShape(enableScrollX()),
                    preferThumb: true,
                    showTitle: true,
                    scalable: true,
                    centerText: true,
                    overlayMoreButton: true,
                    allowBottomPadding: false
                });
            } else if (viewStyle === 'ThumbCard') {
                cardBuilder.buildCards(result.Items, {
                    itemsContainer: elem,
                    shape: getBackdropShape(enableScrollX()),
                    preferThumb: true,
                    showTitle: true,
                    scalable: true,
                    centerText: false,
                    cardLayout: true,
                    showYear: true
                });
            } else if (viewStyle === 'PosterCard') {
                cardBuilder.buildCards(result.Items, {
                    itemsContainer: elem,
                    shape: getPortraitShape(enableScrollX()),
                    showTitle: true,
                    scalable: true,
                    centerText: false,
                    cardLayout: true,
                    showYear: true
                });
            } else if (viewStyle === 'Poster') {
                cardBuilder.buildCards(result.Items, {
                    itemsContainer: elem,
                    shape: getPortraitShape(enableScrollX()),
                    scalable: true,
                    showTitle: true,
                    centerText: true,
                    showYear: true,
                    overlayMoreButton: true,
                    allowBottomPadding: false
                });
            }
            if (result.Items.length >= query.Limit) {
                tabContent.querySelector('.btnMoreFromGenre' + id + ' .material-icons').classList.remove('hide');
            }
        });
    }

    function reloadItems(context, promise) {
        const query = getQuery();
        promise.then(function (result) {
            const elem = context.querySelector('#items');
            let html = '';
            const items = result.Items;

            for (const item of items) {
                html += '<div class="verticalSection">';
                html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
                html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl(item, {
                    context: 'tvshows',
                    parentId: params.topParentId
                }) + '" class="more button-flat button-flat-mini sectionTitleTextButton btnMoreFromGenre' + item.Id + '">';
                html += '<h2 class="sectionTitle sectionTitle-cards">';
                html += escapeHtml(item.Name);
                html += '</h2>';
                html += '<span class="material-icons hide chevron_right" aria-hidden="true"></span>';
                html += '</a>';
                html += '</div>';
                if (enableScrollX()) {
                    let scrollXClass = 'scrollX hiddenScrollX';
                    if (layoutManager.tv) {
                        scrollXClass += 'smoothScrollX padded-top-focusscale padded-bottom-focusscale';
                    }
                    html += '<div is="emby-itemscontainer" class="itemsContainer ' + scrollXClass + ' lazy padded-left padded-right" data-id="' + item.Id + '">';
                } else {
                    html += '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap lazy padded-left padded-right" data-id="' + item.Id + '">';
                }
                html += '</div>';
                html += '</div>';
            }

            if (!result.Items.length) {
                html = '';

                html += '<div class="noItemsMessage centerMessage">';
                html += '<h1>' + globalize.translate('MessageNothingHere') + '</h1>';
                html += '<p>' + globalize.translate('MessageNoGenresAvailable') + '</p>';
                html += '</div>';
            }

            elem.innerHTML = html;
            lazyLoader.lazyChildren(elem, fillItemsContainer);
            userSettings.saveQuerySettings(getSavedQueryKey(), query);
            loading.hide();
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
        userSettings.saveViewSetting(getSavedQueryKey(), viewStyle);
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

