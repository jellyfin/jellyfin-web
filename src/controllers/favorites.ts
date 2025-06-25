import cardBuilder from 'components/cardbuilder/cardBuilder';
import focusManager from 'components/focusManager';
import layoutManager from 'components/layoutManager';
import { appRouter } from 'components/router/appRouter';
import dom from 'scripts/dom';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getBackdropShape, getPortraitShape, getSquareShape } from 'utils/card';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';

import 'elements/emby-itemscontainer/emby-itemscontainer';
import 'elements/emby-scroller/emby-scroller';

function enableScrollX() {
    return true;
}

function getSections() {
    return [{
        name: 'Movies',
        types: 'Movie',
        shape: getPortraitShape(enableScrollX()),
        showTitle: true,
        showYear: true,
        overlayPlayButton: true,
        overlayText: false,
        centerText: true
    }, {
        name: 'Shows',
        types: 'Series',
        shape: getPortraitShape(enableScrollX()),
        showTitle: true,
        showYear: true,
        overlayPlayButton: true,
        overlayText: false,
        centerText: true
    }, {
        name: 'Episodes',
        types: 'Episode',
        shape: getBackdropShape(enableScrollX()),
        preferThumb: false,
        showTitle: true,
        showParentTitle: true,
        overlayPlayButton: true,
        overlayText: false,
        centerText: true
    }, {
        name: 'HeaderVideos',
        types: 'Video',
        shape: getBackdropShape(enableScrollX()),
        preferThumb: true,
        showTitle: true,
        overlayPlayButton: true,
        overlayText: false,
        centerText: true
    }, {
        name: 'MusicVideos',
        types: 'MusicVideo',
        shape: getBackdropShape(enableScrollX()),
        preferThumb: true,
        showTitle: true,
        overlayPlayButton: true,
        overlayText: false,
        centerText: true
    }, {
        name: 'Collections',
        types: 'BoxSet',
        shape: getPortraitShape(enableScrollX()),
        showTitle: true,
        overlayPlayButton: true,
        overlayText: false,
        centerText: true
    }, {
        name: 'Playlists',
        types: 'Playlist',
        shape: getSquareShape(enableScrollX()),
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
        shape: getPortraitShape(enableScrollX()),
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
        shape: getSquareShape(enableScrollX()),
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
        shape: getSquareShape(enableScrollX()),
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
        shape: getSquareShape(enableScrollX()),
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
        shape: getPortraitShape(enableScrollX()),
        showTitle: true,
        showYear: true,
        overlayPlayButton: true,
        overlayText: false,
        centerText: true
    }, {
        name: 'Channels',
        types: 'LiveTVChannel',
        shape: getBackdropShape(enableScrollX()),
        showTitle: true,
        overlayPlayButton: true,
        overlayText: false,
        centerText: true
    }, {
        name: 'HeaderPhotoAlbums',
        types: 'PhotoAlbum',
        shape: getBackdropShape(enableScrollX()),
        showTitle: true,
        overlayPlayButton: true,
        overlayText: false,
        centerText: true
    }, {
        name: 'Photos',
        types: 'Photo',
        shape: getBackdropShape(enableScrollX()),
        showTitle: true,
        overlayPlayButton: true,
        overlayText: false,
        centerText: true
    }];
}

function getFetchDataFn(section) {
    return function () {
        const apiClient = this.apiClient;
        const options = {
            SortBy: [ItemSortBy.SeriesSortName, ItemSortBy.SortName].join(','),
            SortOrder: 'Ascending',
            Filters: 'IsFavorite',
            Recursive: true,
            Fields: 'PrimaryImageAspectRatio',
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
        // NOTE: Why is card layout always disabled?
        // let cardLayout = appHost.preferVisualCards && section.autoCardLayout && section.showTitle;
        const cardLayout = false;
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
            html += '<span class="material-icons chevron_right" aria-hidden="true"></span>';
            html += '</a>';
        }

        html += '</div>';
        html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true"><div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x" data-monitor="markfavorite"></div></div>';
        html += '</div>';
    }

    elem.innerHTML = html;
    window.CustomElements.upgradeSubtree(elem);

    const elems = elem.querySelectorAll('.itemsContainer');

    for (let i = 0, length = elems.length; i < length; i++) {
        const itemsContainer = elems[i];
        itemsContainer.fetchData = getFetchDataFn(sections[i]).bind(instance);
        itemsContainer.getItemsHtml = getItemsHtmlFn(sections[i]).bind(instance);
        itemsContainer.parentContainer = dom.parentWithClass(itemsContainer, 'verticalSection');
    }
}

class FavoritesTab {
    constructor(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = ServerConnections.currentApiClient();
        this.sectionsContainer = view.querySelector('.sections');
        createSections(this, this.sectionsContainer, this.apiClient);
    }

    onResume(options) {
        const promises = [];
        const view = this.view;
        const elems = this.sectionsContainer.querySelectorAll('.itemsContainer');

        for (const elem of elems) {
            promises.push(elem.resume(options));
        }

        Promise.all(promises).then(function () {
            if (options.autoFocus) {
                focusManager.autoFocus(view);
            }
        });
    }

    onPause() {
        if (this.sectionsContainer) {
            Array.from(this.sectionsContainer.querySelectorAll('.itemsContainer'))
                .forEach(e => { e.pause(); });
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
