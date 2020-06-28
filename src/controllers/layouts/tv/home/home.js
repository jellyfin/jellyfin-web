import connectionManager from 'connectionManager';
import loading from 'loading';
import globalize from 'globalize';
import {TabbedPage} from './tabbedPage';
import libraryMenu from 'libraryMenu';
import dom from 'dom';
import focusManager from 'focusManager';
import 'css!./home';

function loadViewHtml(page, parentId, template, viewName, autoFocus) {

    const homeScrollContent = document.querySelector('.contentScrollSlider');
    let html = '';
    html += globalize.translateDocument(template);
    homeScrollContent.innerHTML = html;

    // TODO: remove require
    require([`controllers/layouts/tv/home/views.${viewName}`], viewBuilder => {

        const homePanel = homeScrollContent;
        const apiClient = connectionManager.currentApiClient();
        const tabView = new viewBuilder.default(homePanel, apiClient, parentId, autoFocus);
        tabView.element = homePanel;
        tabView.loadData();
    });
}

function homePage (view) {

    let needsRefresh;

    function reloadTabData(tabView) {

        if (!needsRefresh) {
            return;
        }

        const activeElement = document.activeElement;

        let card = activeElement ? dom.parentWithClass(activeElement, 'card') : null;
        const itemId = card ? card.getAttribute('data-id') : null;

        const parentItemsContainer = activeElement ? dom.parentWithClass(activeElement, 'itemsContainer') : null;

        return tabView.loadData(true).then(() => {

            if (!activeElement || !document.body.contains(activeElement)) {

                if (itemId) {
                    card = tabView.element.querySelector(`*[data-id='${itemId}']`);

                    if (card) {

                        const newParentItemsContainer = dom.parentWithClass(card, 'itemsContainer');

                        if (newParentItemsContainer == parentItemsContainer) {
                            focusManager.focus(card);
                            return;
                        }
                    }
                }

                const focusParent = parentItemsContainer && document.body.contains(parentItemsContainer) ? parentItemsContainer : tabView.element;
                focusManager.autoFocus(focusParent);
            }
            return;
        });
    }

    document.addEventListener('viewshow', ({detail}) => {

        libraryMenu.setTransparentMenu(true);
        const isRestored = detail.isRestored;

        Emby.Page.setTitle('');

        if (isRestored) {
            if (this.tabView) {
                reloadTabData(this.tabView);
            }
        } else {
            loading.show();

            renderTabs(this);
        }
    });

    document.addEventListener('viewhide', () => {

        needsRefresh = false;
    });

    document.addEventListener('viewdestroy', () => {

        if (this.tabbedPage) {
            this.tabbedPage.destroy();
        }
        if (this.tabView) {
            this.tabView.destroy();
        }

    });

    function renderTabs(pageInstance) {

        const apiClient = connectionManager.currentApiClient();
        return apiClient.getUserViews({}, apiClient.getCurrentUserId()).then(({Items}) => {

            const tabbedPageInstance = new TabbedPage(view, {
                handleFocus: true
            });
            tabbedPageInstance.loadViewContent = loadViewContent;
            tabbedPageInstance.renderTabs(Items);
            pageInstance.tabbedPage = tabbedPageInstance;
            return;
        });
    }

    let autoFocusTabContent = true;

    function loadViewContent(page, id, type) {

        return new Promise(resolve => {

            type = (type || '').toLowerCase();

            let viewName = '';

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

            // TODO: remove require
            require([`text!layouts/tv/home/views.${viewName}.html`], template => {

                loadViewHtml(page, id, template, viewName, autoFocusTabContent);
                autoFocusTabContent = false;
                resolve();
            });
        });
    }
}
export default new homePage({});
