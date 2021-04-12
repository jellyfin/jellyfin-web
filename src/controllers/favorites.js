import { appRouter } from '../components/appRouter';
import cardBuilder from '../components/cardbuilder/cardBuilder';
import dom from '../scripts/dom';
import globalize from '../scripts/globalize';
import { appHost } from '../components/apphost';
import layoutManager from '../components/layoutManager';
import focusManager from '../components/focusManager';
import '../elements/emby-itemscontainer/emby-itemscontainer';
import '../elements/emby-scroller/emby-scroller';
import ServerConnections from '../components/ServerConnections';
import imageLoader from '../components/images/imageLoader';

/* eslint-disable indent */

    function enableScrollX() {
        return true;
    }

    function getThumbShape() {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }

    function getPosterShape() {
        return enableScrollX() ? 'overflowPortrait' : 'portrait';
    }

    function getSquareShape() {
        return enableScrollX() ? 'overflowSquare' : 'square';
    }

    function getSections() {
        return [{
            name: 'Movies',
            types: 'Movie',
            shape: getPosterShape(),
            showTitle: true,
            showYear: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        }, {
            name: 'Shows',
            types: 'Series',
            shape: getPosterShape(),
            showTitle: true,
            showYear: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        }, {
            name: 'Episodes',
            types: 'Episode',
            shape: getThumbShape(),
            preferThumb: false,
            showTitle: true,
            showParentTitle: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        }, {
            name: 'Videos',
            types: 'Video',
            shape: getThumbShape(),
            preferThumb: true,
            showTitle: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        }, {
            name: 'Collections',
            types: 'BoxSet',
            shape: getPosterShape(),
            showTitle: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        }, {
            name: 'Playlists',
            types: 'Playlist',
            shape: getSquareShape(),
            preferThumb: false,
            showTitle: true,
            overlayText: false,
            showParentTitle: false,
            centerText: true,
            overlayPlayButton: true,
            coverImage: true
        }, {
            name: 'People',
            types: 'Person',
            shape: getPosterShape(),
            preferThumb: false,
            showTitle: true,
            overlayText: false,
            showParentTitle: false,
            centerText: true,
            overlayPlayButton: true,
            coverImage: true
        }, {
            name: 'Artists',
            types: 'MusicArtist',
            shape: getSquareShape(),
            preferThumb: false,
            showTitle: true,
            overlayText: false,
            showParentTitle: false,
            centerText: true,
            overlayPlayButton: true,
            coverImage: true
        }, {
            name: 'Albums',
            types: 'MusicAlbum',
            shape: getSquareShape(),
            preferThumb: false,
            showTitle: true,
            overlayText: false,
            showParentTitle: true,
            centerText: true,
            overlayPlayButton: true,
            coverImage: true
        }, {
            name: 'Songs',
            types: 'Audio',
            shape: getSquareShape(),
            preferThumb: false,
            showTitle: true,
            overlayText: false,
            showParentTitle: true,
            centerText: true,
            overlayMoreButton: true,
            action: 'instantmix',
            coverImage: true
        }, {
            name: 'Books',
            types: 'Book',
            shape: getPosterShape(),
            showTitle: true,
            showYear: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        }];
    }

    function getFetchDataFn(section) {
        return function () {
            const apiClient = this.apiClient;
            const options = {
                SortBy: (section.types, 'SeriesName,SortName'),
                SortOrder: 'Ascending',
                Filters: 'IsFavorite',
                Recursive: true,
                Fields: 'PrimaryImageAspectRatio,BasicSyncInfo',
                CollapseBoxSetItems: false,
                ExcludeLocationTypes: 'Virtual',
                EnableTotalRecordCount: false
            };
            options.Limit = 20;
            const userId = apiClient.getCurrentUserId();

            if (section.types === 'MusicArtist') {
                return apiClient.getArtists(userId, options);
            }

            if (section.types === 'Person') {
                return apiClient.getPeople(userId, options);
            }

            options.IncludeItemTypes = section.types;
            return apiClient.getItems(userId, options);
        };
    }

    function getRouteUrl(section, serverId) {
        return appRouter.getRouteUrl('list', {
            serverId: serverId,
            itemTypes: section.types,
            isFavorite: true
        });
    }

    function getItemsHtmlFn(section) {
        return function (items) {
            let cardLayout = appHost.preferVisualCards && section.autoCardLayout && section.showTitle;
            cardLayout = false;
            const serverId = this.apiClient.serverId();
            const leadingButtons = layoutManager.tv ? [{
                name: globalize.translate('All'),
                id: 'more',
                icon: 'favorite',
                routeUrl: getRouteUrl(section, serverId)
            }] : null;
            let lines = 0;

            if (section.showTitle) {
                lines++;
            }

            if (section.showYear) {
                lines++;
            }

            if (section.showParentTitle) {
                lines++;
            }

            return cardBuilder.getCardsHtml({
                items: items,
                preferThumb: section.preferThumb,
                shape: section.shape,
                centerText: section.centerText && !cardLayout,
                overlayText: section.overlayText !== false,
                showTitle: section.showTitle,
                showYear: section.showYear,
                showParentTitle: section.showParentTitle,
                scalable: true,
                coverImage: section.coverImage,
                overlayPlayButton: section.overlayPlayButton,
                overlayMoreButton: section.overlayMoreButton && !cardLayout,
                action: section.action,
                allowBottomPadding: !enableScrollX(),
                cardLayout: cardLayout,
                leadingButtons: leadingButtons,
                lines: lines
            });
        };
    }

    function createSections(instance, elem, apiClient) {
        const sections = getSections();
        let html = '';

        for (const section of sections) {
            let sectionClass = 'verticalSection';

            if (!section.showTitle) {
                sectionClass += ' verticalSection-extrabottompadding';
            }

            html += '<div class="' + sectionClass + ' hide">';
            html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';

            if (layoutManager.tv) {
                html += '<h2 class="sectionTitle sectionTitle-cards">' + globalize.translate(section.name) + '</h2>';
            } else {
                html += '<a is="emby-linkbutton" href="' + getRouteUrl(section, apiClient.serverId()) + '" class="more button-flat button-flat-mini sectionTitleTextButton">';
                html += '<h2 class="sectionTitle sectionTitle-cards">';
                html += globalize.translate(section.name);
                html += '</h2>';
                html += '<span class="material-icons chevron_right"></span>';
                html += '</a>';
            }

            html += '</div>';
            html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true"><div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x" data-monitor="markfavorite"></div></div>';
            html += '</div>';
        }

        elem.innerHTML = html;
        const elems = elem.querySelectorAll('.itemsContainer');

        for (let i = 0, length = elems.length; i < length; i++) {
            const itemsContainer = elems[i];
            itemsContainer.fetchData = getFetchDataFn(sections[i]).bind(instance);
            itemsContainer.getItemsHtml = getItemsHtmlFn(sections[i]).bind(instance);
            itemsContainer.parentContainer = dom.parentWithClass(itemsContainer, 'verticalSection');
        }
    }

    function createRecommendations(apiClient, container) {
        let html = '';
        html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';

        if (layoutManager.tv) {
            html += '<h2 class="sectionTitle sectionTitle-cards">' + globalize.translate('FavoriteRecommendations') + '</h2>';
        } else {
            html += '<h2 class="sectionTitle sectionTitle-cards">';
            html += globalize.translate('FavoriteRecommendations');
            html += '</h2>';
        }
        html += '</div>';
        html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
        html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x" data-monitor="markfavorite">';
        html += '</div>';
        html += '</div>';

        container.innerHTML = '';
        container.innerHTML = html;

        const itemsContainer = container.querySelector('.itemsContainer');
        const options = {
            Filters: 'IsNotFolder',
            SortBy: 'PlayCount',
            SortOrder: 'Descending',
            Recursive: true,
            Limit: 10
        };

        apiClient.getItems(apiClient.getCurrentUserId(), options)
        .then((result) => {
            const cardsHtml = cardBuilder.getCardsHtml({
                items: result.Items,
                preferThumb: false,
                showTitle: true,
                overlayText: false,
                showParentTitle: true,
                centerText: true,
                overlayMoreButton: true,
                coverImage: true
            });
            itemsContainer.innerHTML = cardsHtml;
            imageLoader.lazyChildren(itemsContainer);
        });

        itemsContainer.parentContainer = container;
    }

    function toggleNoItemsContent(apiClient, container) {
        apiClient.getItems(apiClient.getCurrentUserId(), {Filters: 'IsFavorite', Recursive: 'true'})
        .then((result) => {
            const favoriteCount = result.Items.length;
            if (favoriteCount) {
                container.classList.add('hide');
            }
            if (!favoriteCount) {
                container.classList.remove('hide');
            }
        });
    }

    function createNoItemsMessage(container) {
        let html = '';
        html += '<h1>' + globalize.translate('MessageNothingHere') + '</h1>';
        html += '<p>' + globalize.translate('MessageNoFavoritesAvailable') + '</p>';
        container.innerHTML = html;
    }

class FavoritesTab {
    constructor(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = ServerConnections.currentApiClient();
        this.sectionsContainer = view.querySelector('.sections');
        this.msgContainer = view.querySelector('.noItemsMessage');
        this.recommendationsContainer = view.querySelector('.recommendations');
        createSections(this, this.sectionsContainer, this.apiClient);
        createNoItemsMessage(this.msgContainer);
        createRecommendations(this.apiClient, this.recommendationsContainer);

        // observe media section changes to check if noItemsContent has to be shown
        this.noItemsContent = view.querySelector('.noItemsContent');
        const mutationObserverConfig = {childList: true, subtree: true};
        const observer = new MutationObserver(() => toggleNoItemsContent(this.apiClient, this.noItemsContent));
        observer.observe(this.sectionsContainer, mutationObserverConfig);
    }

    onResume(options) {
        const promises = (this.apiClient, []);
        const view = this.view;
        const elems = this.sectionsContainer.querySelectorAll('.itemsContainer');
        const apiClient = this.apiClient;
        const noItemsContent = this.noItemsContent;

        for (const elem of elems) {
            promises.push(elem.resume(options));
        }

        Promise.all(promises)
        .then(function () {
            if (options.autoFocus) {
                focusManager.autoFocus(view);
            }
        })
        .then(() => toggleNoItemsContent(apiClient, noItemsContent));
    }

    onPause() {
        const elems = this.sectionsContainer.querySelectorAll('.itemsContainer');

        for (const elem of elems) {
            elem.pause();
        }
    }

    destroy() {
        this.view = null;
        this.params = null;
        this.apiClient = null;
        const elems = this.sectionsContainer.querySelectorAll('.itemsContainer');

        for (const elem of elems) {
            elem.fetchData = null;
            elem.getItemsHtml = null;
            elem.parentContainer = null;
        }

        this.sectionsContainer = null;
    }
}

export default FavoritesTab;

/* eslint-enable indent */
