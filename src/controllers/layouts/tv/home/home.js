import connectionManager from 'connectionManager';
import loading from 'loading';
import globalize from 'globalize';
import {TabbedPage} from './tabbedPage';
import libraryMenu from 'libraryMenu';
import dom from 'dom';
import focusManager from 'focusManager';
import 'css!./home';

function loadViewHtml(page, parentId, template, viewName, autoFocus, self) {

    var homeScrollContent = document.querySelector('.contentScrollSlider');
    var html = '';
    html += globalize.translateDocument(template);
    homeScrollContent.innerHTML = html;

    require(['controllers/layouts/tv/home/views.' + viewName], function (viewBuilder) {

        var homePanel = homeScrollContent;
        var apiClient = connectionManager.currentApiClient();
        var tabView = new viewBuilder.default(homePanel, apiClient, parentId, autoFocus);
        tabView.element = homePanel;
        tabView.loadData();
        self.tabView = tabView;
    });
}

function homePage (view) {

    var self = this;
    var needsRefresh;

    function reloadTabData(tabView) {

        if (!needsRefresh) {
            return;
        }

        var activeElement = document.activeElement;

        var card = activeElement ? dom.parentWithClass(activeElement, 'card') : null;
        var itemId = card ? card.getAttribute('data-id') : null;

        var parentItemsContainer = activeElement ? dom.parentWithClass(activeElement, 'itemsContainer') : null;

        return tabView.loadData(true).then(function () {

            if (!activeElement || !document.body.contains(activeElement)) {

                if (itemId) {
                    card = tabView.element.querySelector('*[data-id=\'' + itemId + '\']');

                    if (card) {

                        var newParentItemsContainer = dom.parentWithClass(card, 'itemsContainer');

                        if (newParentItemsContainer == parentItemsContainer) {
                            focusManager.focus(card);
                            return;
                        }
                    }
                }

                var focusParent = parentItemsContainer && document.body.contains(parentItemsContainer) ? parentItemsContainer : tabView.element;
                focusManager.autoFocus(focusParent);
            }
            return;
        });
    }

    document.addEventListener('viewshow', function (e) {

        libraryMenu.setTransparentMenu(true);
        var isRestored = e.detail.isRestored;

        Emby.Page.setTitle('');

        if (isRestored) {
            if (self.tabView) {
                reloadTabData(self.tabView);
            }
        } else {
            loading.show();

            renderTabs(self);
        }
    });

    document.addEventListener('viewhide', function () {

        needsRefresh = false;
    });

    document.addEventListener('viewdestroy', function () {

        if (self.tabbedPage) {
            self.tabbedPage.destroy();
        }
        if (self.tabView) {
            self.tabView.destroy();
        }

    });

    function renderTabs(pageInstance) {

        var apiClient = connectionManager.currentApiClient();
        return apiClient.getUserViews({}, apiClient.getCurrentUserId()).then(function (result) {

            var tabbedPageInstance = new TabbedPage(view, {
                handleFocus: true
            });
            tabbedPageInstance.loadViewContent = loadViewContent;
            tabbedPageInstance.renderTabs(result.Items);
            pageInstance.tabbedPage = tabbedPageInstance;
            return;
        });
    }

    var autoFocusTabContent = true;

    function loadViewContent(page, id, type) {

        return new Promise(function (resolve) {

            type = (type || '').toLowerCase();

            var viewName = '';

            switch (type) {
                case 'tvshows':
                    viewName = 'tv';
                    break;
                case 'movies':
                    viewName = 'movies';
                    break;
                case 'music':
                    viewName = 'music';
                    break;
                case 'playlists':
                    viewName = 'playlists';
                    break;
                case 'boxsets':
                    viewName = 'collections';
                    break;
                case 'livetv':
                    viewName = 'livetv';
                    break;
                case 'books':
                    viewName = 'books';
                    break;
                default:
                    viewName = 'photos';
                    break;
            }

            require(['text!layouts/tv/home/views.' + viewName + '.html'], function (template) {

                loadViewHtml(page, id, template, viewName, autoFocusTabContent, self);
                autoFocusTabContent = false;
                resolve();
            });
        });
    }
}
export default new homePage({});
