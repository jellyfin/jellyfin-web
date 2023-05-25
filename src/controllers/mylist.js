import { appRouter } from '../components/router/appRouter';
import cardBuilder from '../components/cardbuilder/cardBuilder';
import dom from '../scripts/dom';
import globalize from '../scripts/globalize';
import { appHost } from '../components/apphost';
import layoutManager from '../components/layoutManager';
import focusManager from '../components/focusManager';
import '../elements/emby-itemscontainer/emby-itemscontainer';
import '../elements/emby-scroller/emby-scroller';
import ServerConnections from '../components/ServerConnections';

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
        name: 'Videos',
        types: 'Video',
        shape: getThumbShape(),
        preferThumb: true,
        showTitle: true,
        overlayPlayButton: true,
        overlayText: false,
        centerText: true
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
            SortBy: 'LastMyListDate',
            SortOrder: 'Descending',
            Filters: 'IsMyList',
            Recursive: true,
            Fields: 'PrimaryImageAspectRatio,BasicSyncInfo',
            CollapseBoxSetItems: false,
            ExcludeLocationTypes: 'Virtual',
            EnableTotalRecordCount: false
        };
        options.Limit = 20;
        const userId = apiClient.getCurrentUserId();

        options.IncludeItemTypes = section.types;
        return apiClient.getItems(userId, options);
    };
}

function getRouteUrl(section, serverId) {
    return appRouter.getRouteUrl('list', {
        serverId: serverId,
        itemTypes: section.types,
        isMyList: true
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
            icon: 'remove_red_eye',
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
        html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true"><div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x" data-monitor="markmylist"></div></div>';
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

class MyListTab {
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

export default MyListTab;

