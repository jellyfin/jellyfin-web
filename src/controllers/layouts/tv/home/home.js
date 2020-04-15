define(['connectionManager', 'loading', 'globalize', 'tabbedPage', 'libraryMenu', "dom", 'focusManager', 'css!./home'], function (connectionManager, loading, globalize, tabbedPage, libraryMenu, dom, focusManager) {
    'use strict';

    function loadViewHtml(page, parentId, template, viewName, autoFocus, self) {

        var homeScrollContent = page.querySelector('.contentScrollSlider');
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

            var activeElement = view.activeElement;

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

        view.addEventListener('viewshow', function (e) {

            libraryMenu.setTransparentMenu(true);
            var isRestored = e.detail.isRestored;

            Emby.Page.setTitle('');

            if (isRestored) {
                if (self.tabView) {
                    reloadTabData(self.tabView);
                }
            } else {
                loading.show();

                renderTabs(view, self);
            }
        });

        view.addEventListener('viewhide', function () {

            needsRefresh = false;
        });

        view.addEventListener('viewdestroy', function () {

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

                var tabbedPageInstance = new tabbedPage.default(view, {
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
                    default:
                        viewName = 'generic';
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

    return homePage;

});
