import loading from './loading/loading';
import cardBuilder from './cardbuilder/cardBuilder';
import dom from '../scripts/dom';
import { appHost } from './apphost';
import imageLoader from './images/imageLoader';
import globalize from '../scripts/globalize';
import layoutManager from './layoutManager';
import '../assets/css/scrollstyles.scss';
import '../elements/emby-itemscontainer/emby-itemscontainer';

/* eslint-disable indent */

    function enableScrollX() {
        return !layoutManager.desktop;
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
            id: 'favoriteMovies',
            shape: getPosterShape(),
            showTitle: false,
            overlayPlayButton: true
        }, {
            name: 'Shows',
            types: 'Series',
            id: 'favoriteShows',
            shape: getPosterShape(),
            showTitle: false,
            overlayPlayButton: true
        }, {
            name: 'Episodes',
            types: 'Episode',
            id: 'favoriteEpisode',
            shape: getThumbShape(),
            preferThumb: false,
            showTitle: true,
            showParentTitle: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        }, {
            name: 'Videos',
            types: 'Video,MusicVideo',
            id: 'favoriteVideos',
            shape: getThumbShape(),
            preferThumb: true,
            showTitle: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        }, {
            name: 'Artists',
            types: 'MusicArtist',
            id: 'favoriteArtists',
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
            id: 'favoriteAlbums',
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
            id: 'favoriteSongs',
            shape: getSquareShape(),
            preferThumb: false,
            showTitle: true,
            overlayText: false,
            showParentTitle: true,
            centerText: true,
            overlayMoreButton: true,
            action: 'instantmix',
            coverImage: true
        }];
    }

    function loadSection(elem, userId, topParentId, section, isSingleSection) {
        const screenWidth = dom.getWindowSize().innerWidth;
        const options = {
            SortBy: 'SortName',
            SortOrder: 'Ascending',
            Filters: 'IsFavorite',
            Recursive: true,
            Fields: 'PrimaryImageAspectRatio,BasicSyncInfo',
            CollapseBoxSetItems: false,
            ExcludeLocationTypes: 'Virtual',
            EnableTotalRecordCount: false
        };

        if (topParentId) {
            options.ParentId = topParentId;
        }

        if (!isSingleSection) {
            options.Limit = screenWidth >= 1920 ? 10 : screenWidth >= 1440 ? 8 : 6;

            if (enableScrollX()) {
                options.Limit = 20;
            }
        }

        let promise;

        if (section.types === 'MusicArtist') {
            promise = ApiClient.getArtists(userId, options);
        } else {
            options.IncludeItemTypes = section.types;
            promise = ApiClient.getItems(userId, options);
        }

        return promise.then(function (result) {
            let html = '';

            if (result.Items.length) {
                if (html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">', !layoutManager.tv && options.Limit && result.Items.length >= options.Limit) {
                    html += '<a is="emby-linkbutton" href="' + ('#!/list.html?serverId=' + ApiClient.serverId() + '&type=' + section.types + '&IsFavorite=true') + '" class="more button-flat button-flat-mini sectionTitleTextButton">';
                    html += '<h2 class="sectionTitle sectionTitle-cards">';
                    html += globalize.translate(section.name);
                    html += '</h2>';
                    html += '<span class="material-icons chevron_right"></span>';
                    html += '</a>';
                } else {
                    html += '<h2 class="sectionTitle sectionTitle-cards">' + globalize.translate(section.name) + '</h2>';
                }

                html += '</div>';
                if (enableScrollX()) {
                    let scrollXClass = 'scrollX hiddenScrollX';
                    if (layoutManager.tv) {
                        scrollXClass += ' smoothScrollX';
                    }

                    html += '<div is="emby-itemscontainer" class="itemsContainer ' + scrollXClass + ' padded-left padded-right">';
                } else {
                    html += '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap padded-left padded-right">';
                }

                let cardLayout = appHost.preferVisualCards && section.autoCardLayout && section.showTitle;
                cardLayout = false;
                html += cardBuilder.getCardsHtml(result.Items, {
                    preferThumb: section.preferThumb,
                    shape: section.shape,
                    centerText: section.centerText && !cardLayout,
                    overlayText: section.overlayText !== false,
                    showTitle: section.showTitle,
                    showParentTitle: section.showParentTitle,
                    scalable: true,
                    coverImage: section.coverImage,
                    overlayPlayButton: section.overlayPlayButton,
                    overlayMoreButton: section.overlayMoreButton && !cardLayout,
                    action: section.action,
                    allowBottomPadding: !enableScrollX(),
                    cardLayout: cardLayout
                });
                html += '</div>';
            }

            elem.innerHTML = html;
            imageLoader.lazyChildren(elem);
        });
    }

    export function loadSections(page, userId, topParentId, types) {
        loading.show();
        let sections = getSections();
        const sectionid = getParameterByName('sectionid');

        if (sectionid) {
            sections = sections.filter(function (s) {
                return s.id === sectionid;
            });
        }

        if (types) {
            sections = sections.filter(function (s) {
                return types.indexOf(s.id) !== -1;
            });
        }

        let elem = page.querySelector('.favoriteSections');

        if (!elem.innerHTML) {
            let html = '';

            for (let i = 0, length = sections.length; i < length; i++) {
                html += '<div class="verticalSection section' + sections[i].id + '"></div>';
            }

            elem.innerHTML = html;
        }

        const promises = [];

        for (let i = 0, length = sections.length; i < length; i++) {
            const section = sections[i];
            elem = page.querySelector('.section' + section.id);
            promises.push(loadSection(elem, userId, topParentId, section, sections.length === 1));
        }

        Promise.all(promises).then(function () {
            loading.hide();
        });
    }

export default {
    render: loadSections
};

/* eslint-enable indent */
