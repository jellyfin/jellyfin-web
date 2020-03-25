define(['loading', 'globalize', 'connectionManager', 'components/tabbedpage', 'libraryMenu', 'focusManager', 'playbackManager', 'layoutManager', 'browser', 'events', 'css!./home'], function (loading, globalize, connectionManager, tabbedPage, libraryMenu, focusManager, playbackManager, events) {
    'use strict';

    function loadViewHtml(page, parentId, html, viewName, autoFocus, self) {

        var homeScrollContent = page.querySelector('.contentScrollSlider');

        html = html;
        homeScrollContent.innerHTML = globalize.translateDocument(html);

        require(['controllers/tvhome/views.' + viewName], function (viewBuilder) {

            var homePanel = homeScrollContent;
            var apiClient = connectionManager.currentApiClient();
            var tabView = new viewBuilder(homePanel, apiClient, parentId, autoFocus);
            tabView.element = homePanel;
            tabView.loadData();
            self.tabView = tabView;
        });
    }

    function parentWithClass(elem, className) {

        while (!elem.classList || !elem.classList.contains(className)) {
            elem = elem.parentNode;

            if (!elem) {
                return null;
            }
        }

        return elem;
    }

    return function (view, params) {

        var self = this;
        var needsRefresh;

        function reloadTabData(tabView) {

            if (!needsRefresh) {
                return;
            }

            var activeElement = view.activeElement;

            var card = activeElement ? parentWithClass(activeElement, 'card') : null;
            var itemId = card ? card.getAttribute('data-id') : null;

            var parentItemsContainer = activeElement ? parentWithClass(activeElement, 'itemsContainer') : null;

            tabView.loadData(true).then(function () {

                var tabView = self.tabView;

                if (!activeElement || !document.body.contains(activeElement)) {

                    if (itemId) {
                        card = tabView.element.querySelector('*[data-id=\'' + itemId + '\']');

                        if (card) {

                            var newParentItemsContainer = parentWithClass(card, 'itemsContainer');

                            if (newParentItemsContainer == parentItemsContainer) {
                                focusManager.focus(card);
                                return;
                            }
                        }
                    }

                    var focusParent = parentItemsContainer && document.body.contains(parentItemsContainer) ? parentItemsContainer : tabView.element;
                    focusManager.autoFocus(focusParent);
                }

            });
        }

        view.addEventListener('viewbeforeshow', function (e) {

            self.reloadPromise = null;

            var isRestored = e.detail.isRestored;

            if (isRestored) {
                if (self.tabView) {
                    self.reloadPromise = reloadTabData(self.tabView);
                }
            }
        });

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

        function renderTabs(view, pageInstance) {

            var apiClient = connectionManager.currentApiClient();
            apiClient.getUserViews({}, apiClient.getCurrentUserId()).then(function (result) {

                var tabbedPageInstance = new tabbedPage(view, {
                    handleFocus: true
                });
                tabbedPageInstance.loadViewContent = loadViewContent;
                tabbedPageInstance.renderTabs(result.Items);
                pageInstance.tabbedPage = tabbedPageInstance;
            });
        }

        var autoFocusTabContent = true;

        function loadViewContent(page, id, type) {

            return new Promise(function (resolve, reject) {

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

                require(['text!tvhome/views.' + viewName + '.html'], function (html) {

                    loadViewHtml(page, id, html, viewName, autoFocusTabContent, self);
                    autoFocusTabContent = false;
                    resolve();
                });
            });
        }
    };

});
