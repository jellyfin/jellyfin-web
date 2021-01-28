import cardBuilder from '../cardbuilder/cardBuilder';
import dom from '../../scripts/dom';
import layoutManager from '../layoutManager';
import imageLoader from '../images/imageLoader';
import globalize from '../../scripts/globalize';
import { appRouter } from '../appRouter';
import imageHelper from '../../scripts/imagehelper';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-itemscontainer/emby-itemscontainer';
import '../../elements/emby-scroller/emby-scroller';
import '../../elements/emby-button/emby-button';
import './homesections.scss';
import Dashboard from '../../scripts/clientUtils';
import ServerConnections from '../ServerConnections';

/* eslint-disable indent */

    export function getDefaultSection(index) {
        switch (index) {
            case 0:
                return 'smalllibrarytiles';
            case 1:
                return 'resume';
            case 2:
                return 'resumeaudio';
            case 3:
                return 'livetv';
            case 4:
                return 'nextup';
            case 5:
                return 'latestmedia';
            case 6:
                return 'none';
            default:
                return '';
        }
    }

    function getAllSectionsToShow(userSettings, sectionCount) {
        const sections = [];
        for (let i = 0, length = sectionCount; i < length; i++) {
            let section = userSettings.get('homesection' + i) || getDefaultSection(i);
            if (section === 'folders') {
                section = getDefaultSection(0);
            }

            sections.push(section);
        }

        return sections;
    }

    export function loadSections(elem, apiClient, user, userSettings) {
        return getUserViews(apiClient, user.Id).then(function (userViews) {
            let html = '';

            if (userViews.length) {
                const sectionCount = 7;
                for (let i = 0; i < sectionCount; i++) {
                    html += '<div class="verticalSection section' + i + '"></div>';
                }

                elem.innerHTML = html;
                elem.classList.add('homeSectionsContainer');

                const promises = [];
                const sections = getAllSectionsToShow(userSettings, sectionCount);
                for (let i = 0; i < sections.length; i++) {
                    promises.push(loadSection(elem, apiClient, user, userSettings, userViews, sections, i));
                }

                return Promise.all(promises).then(function () {
                    return resume(elem, {
                        refresh: true,
                        returnPromise: false
                    });
                });
            } else {
                let noLibDescription;
                if (user['Policy'] && user['Policy']['IsAdministrator']) {
                    noLibDescription = globalize.translate('NoCreatedLibraries', '<br><a id="button-createLibrary" class="button-link">', '</a>');
                } else {
                    noLibDescription = globalize.translate('AskAdminToCreateLibrary');
                }

                html += '<div class="centerMessage padded-left padded-right">';
                html += '<h2>' + globalize.translate('MessageNothingHere') + '</h2>';
                html += '<p>' + noLibDescription + '</p>';
                html += '</div>';
                elem.innerHTML = html;

                const createNowLink = elem.querySelector('#button-createLibrary');
                if (createNowLink) {
                    createNowLink.addEventListener('click', function () {
                        Dashboard.navigate('library.html');
                    });
                }
            }
        });
    }

    export function destroySections(elem) {
        const elems = elem.querySelectorAll('.itemsContainer');
        for (let i = 0; i < elems.length; i++) {
            elems[i].fetchData = null;
            elems[i].parentContainer = null;
            elems[i].getItemsHtml = null;
        }

        elem.innerHTML = '';
    }

    export function pause(elem) {
        const elems = elem.querySelectorAll('.itemsContainer');
        for (let i = 0; i < elems.length; i++) {
            elems[i].pause();
        }
    }

    export function resume(elem, options) {
        const elems = elem.querySelectorAll('.itemsContainer');
        const promises = [];

        for (let i = 0, length = elems.length; i < length; i++) {
            promises.push(elems[i].resume(options));
        }

        const promise = Promise.all(promises);
        if (!options || options.returnPromise !== false) {
            return promise;
        }
    }

    function loadSection(page, apiClient, user, userSettings, userViews, allSections, index) {
        const section = allSections[index];
        const elem = page.querySelector('.section' + index);

        if (section === 'latestmedia') {
            loadRecentlyAdded(elem, apiClient, user, userViews);
        } else if (section === 'librarytiles' || section === 'smalllibrarytiles' || section === 'smalllibrarytiles-automobile' || section === 'librarytiles-automobile') {
            loadLibraryTiles(elem, apiClient, user, userSettings, 'smallBackdrop', userViews);
        } else if (section === 'librarybuttons') {
            loadlibraryButtons(elem, apiClient, user, userSettings, userViews);
        } else if (section === 'resume') {
            loadResumeVideo(elem, apiClient);
        } else if (section === 'resumeaudio') {
            loadResumeAudio(elem, apiClient);
        } else if (section === 'activerecordings') {
            loadLatestLiveTvRecordings(elem, true, apiClient);
        } else if (section === 'nextup') {
            loadNextUp(elem, apiClient);
        } else if (section === 'onnow' || section === 'livetv') {
            return loadOnNow(elem, apiClient, user);
        } else {
            elem.innerHTML = '';
            return Promise.resolve();
        }
        return Promise.resolve();
    }

    function getUserViews(apiClient, userId) {
        return apiClient.getUserViews({}, userId || apiClient.getCurrentUserId()).then(function (result) {
            return result.Items;
        });
    }

    function enableScrollX() {
        return true;
    }

    function getSquareShape() {
        return enableScrollX() ? 'overflowSquare' : 'square';
    }

    function getThumbShape() {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }

    function getPortraitShape() {
        return enableScrollX() ? 'overflowPortrait' : 'portrait';
    }

    function getLibraryButtonsHtml(items) {
        let html = '';

        html += '<div class="verticalSection verticalSection-extrabottompadding">';
        html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate('HeaderMyMedia') + '</h2>';

        html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x" data-multiselect="false">';

        // library card background images
        for (let i = 0, length = items.length; i < length; i++) {
            const item = items[i];
            const icon = imageHelper.getLibraryIcon(item.CollectionType);
            html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl(item) + '" class="raised homeLibraryButton"><span class="material-icons homeLibraryIcon ' + icon + '"></span><span class="homeLibraryText">' + item.Name + '</span></a>';
        }

        html += '</div>';
        html += '</div>';

        return html;
    }

    function loadlibraryButtons(elem, apiClient, user, userSettings, userViews) {
        elem.classList.remove('verticalSection');
        const html = getLibraryButtonsHtml(userViews);

        elem.innerHTML = html;
        imageLoader.lazyChildren(elem);
    }

    function getFetchLatestItemsFn(serverId, parentId, collectionType) {
        return function () {
            const apiClient = ServerConnections.getApiClient(serverId);
            let limit = 16;

            if (enableScrollX()) {
                if (collectionType === 'music') {
                    limit = 30;
                }
            } else {
                if (collectionType === 'tvshows') {
                    limit = 5;
                } else if (collectionType === 'music') {
                    limit = 9;
                } else {
                    limit = 8;
                }
            }

            const options = {
                Limit: limit,
                Fields: 'PrimaryImageAspectRatio,BasicSyncInfo,Path',
                ImageTypeLimit: 1,
                EnableImageTypes: 'Primary,Backdrop,Thumb',
                ParentId: parentId
            };

            return apiClient.getLatestItems(options);
        };
    }

    function getLatestItemsHtmlFn(itemType, viewType) {
        return function (items) {
            const cardLayout = false;
            let shape;
            if (itemType === 'Channel' || viewType === 'movies' || viewType === 'books' || viewType === 'tvshows') {
                shape = getPortraitShape();
            } else if (viewType === 'music' || viewType === 'homevideos') {
                shape = getSquareShape();
            } else {
                shape = getThumbShape();
            }

            return cardBuilder.getCardsHtml({
                items: items,
                shape: shape,
                preferThumb: viewType !== 'movies' && viewType !== 'tvshows' && itemType !== 'Channel' && viewType !== 'music' ? 'auto' : null,
                showUnplayedIndicator: false,
                showChildCountIndicator: true,
                context: 'home',
                overlayText: false,
                centerText: !cardLayout,
                overlayPlayButton: viewType !== 'photos',
                allowBottomPadding: !enableScrollX() && !cardLayout,
                cardLayout: cardLayout,
                showTitle: viewType !== 'photos',
                showYear: viewType === 'movies' || viewType === 'tvshows' || !viewType,
                showParentTitle: viewType === 'music' || viewType === 'tvshows' || !viewType || (cardLayout && (viewType === 'tvshows')),
                lines: 2
            });
        };
    }

    function renderLatestSection(elem, apiClient, user, parent) {
        let html = '';

        html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
        if (!layoutManager.tv) {
            html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl(parent, {
                section: 'latest'
            }) + '" class="more button-flat button-flat-mini sectionTitleTextButton">';
            html += '<h2 class="sectionTitle sectionTitle-cards">';
            html += globalize.translate('LatestFromLibrary', parent.Name);
            html += '</h2>';
            html += '<span class="material-icons chevron_right"></span>';
            html += '</a>';
        } else {
            html += '<h2 class="sectionTitle sectionTitle-cards">' + globalize.translate('LatestFromLibrary', parent.Name) + '</h2>';
        }
        html += '</div>';

        if (enableScrollX()) {
            html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
            html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x">';
        } else {
            html += '<div is="emby-itemscontainer" class="itemsContainer focuscontainer-x padded-left padded-right vertical-wrap">';
        }

        if (enableScrollX()) {
            html += '</div>';
        }
        html += '</div>';

        elem.innerHTML = html;

        const itemsContainer = elem.querySelector('.itemsContainer');
        itemsContainer.fetchData = getFetchLatestItemsFn(apiClient.serverId(), parent.Id, parent.CollectionType);
        itemsContainer.getItemsHtml = getLatestItemsHtmlFn(parent.Type, parent.CollectionType);
        itemsContainer.parentContainer = elem;
    }

    function loadRecentlyAdded(elem, apiClient, user, userViews) {
        elem.classList.remove('verticalSection');
        const excludeViewTypes = ['playlists', 'livetv', 'boxsets', 'channels'];

        for (let i = 0, length = userViews.length; i < length; i++) {
            const item = userViews[i];
            if (user.Configuration.LatestItemsExcludes.indexOf(item.Id) !== -1) {
                continue;
            }

            if (excludeViewTypes.indexOf(item.CollectionType || []) !== -1) {
                continue;
            }

            const frag = document.createElement('div');
            frag.classList.add('verticalSection');
            frag.classList.add('hide');
            elem.appendChild(frag);

            renderLatestSection(frag, apiClient, user, item);
        }
    }

    export function loadLibraryTiles(elem, apiClient, user, userSettings, shape, userViews) {
        let html = '';
        if (userViews.length) {
            html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate('HeaderMyMedia') + '</h2>';
            if (enableScrollX()) {
                html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
                html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x">';
            } else {
                html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right focuscontainer-x vertical-wrap">';
            }

            html += cardBuilder.getCardsHtml({
                items: userViews,
                shape: getThumbShape(),
                showTitle: true,
                centerText: true,
                overlayText: false,
                lazy: true,
                transition: false,
                allowBottomPadding: !enableScrollX()
            });

            if (enableScrollX()) {
                html += '</div>';
            }
            html += '</div>';
        }

        elem.innerHTML = html;
        imageLoader.lazyChildren(elem);
    }

    function getContinueWatchingFetchFn(serverId) {
        return function () {
            const apiClient = ServerConnections.getApiClient(serverId);
            const screenWidth = dom.getWindowSize().innerWidth;

            let limit;
            if (enableScrollX()) {
                limit = 12;
            } else {
                limit = screenWidth >= 1920 ? 8 : (screenWidth >= 1600 ? 8 : (screenWidth >= 1200 ? 9 : 6));
                limit = Math.min(limit, 5);
            }

            const options = {
                Limit: limit,
                Recursive: true,
                Fields: 'PrimaryImageAspectRatio,BasicSyncInfo',
                ImageTypeLimit: 1,
                EnableImageTypes: 'Primary,Backdrop,Thumb',
                EnableTotalRecordCount: false,
                MediaTypes: 'Video'
            };

            return apiClient.getResumableItems(apiClient.getCurrentUserId(), options);
        };
    }

    function getContinueWatchingItemsHtml(items) {
        const cardLayout = false;
        return cardBuilder.getCardsHtml({
            items: items,
            preferThumb: true,
            shape: getThumbShape(),
            overlayText: false,
            showTitle: true,
            showParentTitle: true,
            lazy: true,
            showDetailsMenu: true,
            overlayPlayButton: true,
            context: 'home',
            centerText: !cardLayout,
            allowBottomPadding: false,
            cardLayout: cardLayout,
            showYear: true,
            lines: 2
        });
    }

    function loadResumeVideo(elem, apiClient) {
        let html = '';

        html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate('HeaderContinueWatching') + '</h2>';
        if (enableScrollX()) {
            html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
            html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x" data-monitor="videoplayback,markplayed">';
        } else {
            html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x" data-monitor="videoplayback,markplayed">';
        }

        if (enableScrollX()) {
            html += '</div>';
        }
        html += '</div>';

        elem.classList.add('hide');
        elem.innerHTML = html;

        const itemsContainer = elem.querySelector('.itemsContainer');
        itemsContainer.fetchData = getContinueWatchingFetchFn(apiClient.serverId());
        itemsContainer.getItemsHtml = getContinueWatchingItemsHtml;
        itemsContainer.parentContainer = elem;
    }

    function getContinueListeningFetchFn(serverId) {
        return function () {
            const apiClient = ServerConnections.getApiClient(serverId);
            const screenWidth = dom.getWindowSize().innerWidth;

            let limit;
            if (enableScrollX()) {
                limit = 12;
            } else {
                limit = screenWidth >= 1920 ? 8 : (screenWidth >= 1600 ? 8 : (screenWidth >= 1200 ? 9 : 6));
                limit = Math.min(limit, 5);
            }

            const options = {
                Limit: limit,
                Recursive: true,
                Fields: 'PrimaryImageAspectRatio,BasicSyncInfo',
                ImageTypeLimit: 1,
                EnableImageTypes: 'Primary,Backdrop,Thumb',
                EnableTotalRecordCount: false,
                MediaTypes: 'Audio'
            };

            return apiClient.getResumableItems(apiClient.getCurrentUserId(), options);
        };
    }

    function getContinueListeningItemsHtml(items) {
        const cardLayout = false;
        return cardBuilder.getCardsHtml({
            items: items,
            preferThumb: true,
            shape: getThumbShape(),
            overlayText: false,
            showTitle: true,
            showParentTitle: true,
            lazy: true,
            showDetailsMenu: true,
            overlayPlayButton: true,
            context: 'home',
            centerText: !cardLayout,
            allowBottomPadding: false,
            cardLayout: cardLayout,
            showYear: true,
            lines: 2
        });
    }

    function loadResumeAudio(elem, apiClient) {
        let html = '';

        html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate('HeaderContinueListening') + '</h2>';
        if (enableScrollX()) {
            html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
            html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x" data-monitor="audioplayback,markplayed">';
        } else {
            html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x" data-monitor="audioplayback,markplayed">';
        }

        if (enableScrollX()) {
            html += '</div>';
        }
        html += '</div>';

        elem.classList.add('hide');
        elem.innerHTML = html;

        const itemsContainer = elem.querySelector('.itemsContainer');
        itemsContainer.fetchData = getContinueListeningFetchFn(apiClient.serverId());
        itemsContainer.getItemsHtml = getContinueListeningItemsHtml;
        itemsContainer.parentContainer = elem;
    }

    function getOnNowFetchFn(serverId) {
        return function () {
            const apiClient = ServerConnections.getApiClient(serverId);
            return apiClient.getLiveTvRecommendedPrograms({
                userId: apiClient.getCurrentUserId(),
                IsAiring: true,
                limit: 24,
                ImageTypeLimit: 1,
                EnableImageTypes: 'Primary,Thumb,Backdrop',
                EnableTotalRecordCount: false,
                Fields: 'ChannelInfo,PrimaryImageAspectRatio'
            });
        };
    }

    function getOnNowItemsHtml(items) {
        return cardBuilder.getCardsHtml({
            items: items,
            preferThumb: 'auto',
            inheritThumb: false,
            shape: (enableScrollX() ? 'autooverflow' : 'auto'),
            showParentTitleOrTitle: true,
            showTitle: true,
            centerText: true,
            coverImage: true,
            overlayText: false,
            allowBottomPadding: !enableScrollX(),
            showAirTime: true,
            showChannelName: false,
            showAirDateTime: false,
            showAirEndTime: true,
            defaultShape: getThumbShape(),
            lines: 3,
            overlayPlayButton: true
        });
    }

    function loadOnNow(elem, apiClient, user) {
        if (!user.Policy.EnableLiveTvAccess) {
            return Promise.resolve();
        }

        return apiClient.getLiveTvRecommendedPrograms({
            userId: apiClient.getCurrentUserId(),
            IsAiring: true,
            limit: 1,
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Thumb,Backdrop',
            EnableTotalRecordCount: false,
            Fields: 'ChannelInfo,PrimaryImageAspectRatio'
        }).then(function (result) {
            let html = '';
            if (result.Items.length) {
                elem.classList.remove('padded-left');
                elem.classList.remove('padded-right');
                elem.classList.remove('padded-bottom');
                elem.classList.remove('verticalSection');

                html += '<div class="verticalSection">';
                html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
                html += '<h2 class="sectionTitle sectionTitle-cards">' + globalize.translate('LiveTV') + '</h2>';
                html += '</div>';

                if (enableScrollX()) {
                    html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true" data-scrollbuttons="false">';
                    html += '<div class="padded-top padded-bottom scrollSlider focuscontainer-x">';
                } else {
                    html += '<div class="padded-top padded-bottom focuscontainer-x">';
                }

                html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl('livetv', {
                    serverId: apiClient.serverId(),
                    section: 'programs'
                }) + '" class="raised"><span>' + globalize.translate('Programs') + '</span></a>';

                html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl('livetv', {
                    serverId: apiClient.serverId(),
                    section: 'guide'
                }) + '" class="raised"><span>' + globalize.translate('Guide') + '</span></a>';

                html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl('recordedtv', {
                    serverId: apiClient.serverId()
                }) + '" class="raised"><span>' + globalize.translate('Recordings') + '</span></a>';

                html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl('livetv', {
                    serverId: apiClient.serverId(),
                    section: 'dvrschedule'
                }) + '" class="raised"><span>' + globalize.translate('Schedule') + '</span></a>';

                html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl('livetv', {
                    serverId: apiClient.serverId(),
                    section: 'seriesrecording'
                }) + '" class="raised"><span>' + globalize.translate('Series') + '</span></a>';

                html += '</div>';
                if (enableScrollX()) {
                    html += '</div>';
                }
                html += '</div>';
                html += '</div>';

                html += '<div class="verticalSection">';
                html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';

                if (!layoutManager.tv) {
                    html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl('livetv', {
                        serverId: apiClient.serverId(),
                        section: 'onnow'
                    }) + '" class="more button-flat button-flat-mini sectionTitleTextButton">';
                    html += '<h2 class="sectionTitle sectionTitle-cards">';
                    html += globalize.translate('HeaderOnNow');
                    html += '</h2>';
                    html += '<span class="material-icons chevron_right"></span>';
                    html += '</a>';
                } else {
                    html += '<h2 class="sectionTitle sectionTitle-cards">' + globalize.translate('HeaderOnNow') + '</h2>';
                }
                html += '</div>';

                if (enableScrollX()) {
                    html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
                    html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x">';
                } else {
                    html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x">';
                }

                if (enableScrollX()) {
                    html += '</div>';
                }

                html += '</div>';
                html += '</div>';

                elem.innerHTML = html;

                const itemsContainer = elem.querySelector('.itemsContainer');
                itemsContainer.parentContainer = elem;
                itemsContainer.fetchData = getOnNowFetchFn(apiClient.serverId());
                itemsContainer.getItemsHtml = getOnNowItemsHtml;
            }
        });
    }

    function getNextUpFetchFn(serverId) {
        return function () {
            const apiClient = ServerConnections.getApiClient(serverId);
            return apiClient.getNextUpEpisodes({
                Limit: enableScrollX() ? 24 : 15,
                Fields: 'PrimaryImageAspectRatio,DateCreated,BasicSyncInfo,Path',
                UserId: apiClient.getCurrentUserId(),
                ImageTypeLimit: 1,
                EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
                EnableTotalRecordCount: false
            });
        };
    }

    function getNextUpItemsHtml(items) {
        const cardLayout = false;
        return cardBuilder.getCardsHtml({
            items: items,
            preferThumb: true,
            shape: getThumbShape(),
            overlayText: false,
            showTitle: true,
            showParentTitle: true,
            lazy: true,
            overlayPlayButton: true,
            context: 'home',
            centerText: !cardLayout,
            allowBottomPadding: !enableScrollX(),
            cardLayout: cardLayout
        });
    }

    function loadNextUp(elem, apiClient) {
        let html = '';

        html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
        if (!layoutManager.tv) {
            html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl('nextup', {
                serverId: apiClient.serverId()
            }) + '" class="button-flat button-flat-mini sectionTitleTextButton">';
            html += '<h2 class="sectionTitle sectionTitle-cards">';
            html += globalize.translate('NextUp');
            html += '</h2>';
            html += '<span class="material-icons chevron_right"></span>';
            html += '</a>';
        } else {
            html += '<h2 class="sectionTitle sectionTitle-cards">' + globalize.translate('NextUp') + '</h2>';
        }
        html += '</div>';

        if (enableScrollX()) {
            html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
            html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x" data-monitor="videoplayback,markplayed">';
        } else {
            html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x" data-monitor="videoplayback,markplayed">';
        }

        if (enableScrollX()) {
            html += '</div>';
        }
        html += '</div>';

        elem.classList.add('hide');
        elem.innerHTML = html;

        const itemsContainer = elem.querySelector('.itemsContainer');
        itemsContainer.fetchData = getNextUpFetchFn(apiClient.serverId());
        itemsContainer.getItemsHtml = getNextUpItemsHtml;
        itemsContainer.parentContainer = elem;
    }

    function getLatestRecordingsFetchFn(serverId, activeRecordingsOnly) {
        return function () {
            const apiClient = ServerConnections.getApiClient(serverId);
            return apiClient.getLiveTvRecordings({
                userId: apiClient.getCurrentUserId(),
                Limit: enableScrollX() ? 12 : 5,
                Fields: 'PrimaryImageAspectRatio,BasicSyncInfo',
                EnableTotalRecordCount: false,
                IsLibraryItem: activeRecordingsOnly ? null : false,
                IsInProgress: activeRecordingsOnly ? true : null
            });
        };
    }

    function getLatestRecordingItemsHtml(activeRecordingsOnly) {
        return function (items) {
            return cardBuilder.getCardsHtml({
                items: items,
                shape: enableScrollX() ? 'autooverflow' : 'auto',
                showTitle: true,
                showParentTitle: true,
                coverImage: true,
                lazy: true,
                showDetailsMenu: true,
                centerText: true,
                overlayText: false,
                showYear: true,
                lines: 2,
                overlayPlayButton: !activeRecordingsOnly,
                allowBottomPadding: !enableScrollX(),
                preferThumb: true,
                cardLayout: false,
                overlayMoreButton: activeRecordingsOnly,
                action: activeRecordingsOnly ? 'none' : null,
                centerPlayButton: activeRecordingsOnly
            });
        };
    }

    function loadLatestLiveTvRecordings(elem, activeRecordingsOnly, apiClient) {
        const title = activeRecordingsOnly ?
            globalize.translate('HeaderActiveRecordings') :
            globalize.translate('HeaderLatestRecordings');

        let html = '';

        html += '<div class="sectionTitleContainer sectionTitleContainer-cards">';
        html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + title + '</h2>';
        html += '</div>';

        if (enableScrollX()) {
            html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
            html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x">';
        } else {
            html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x">';
        }

        if (enableScrollX()) {
            html += '</div>';
        }
        html += '</div>';

        elem.classList.add('hide');
        elem.innerHTML = html;

        const itemsContainer = elem.querySelector('.itemsContainer');
        itemsContainer.fetchData = getLatestRecordingsFetchFn(apiClient.serverId(), activeRecordingsOnly);
        itemsContainer.getItemsHtml = getLatestRecordingItemsHtml(activeRecordingsOnly);
        itemsContainer.parentContainer = elem;
    }

export default {
    loadLibraryTiles: loadLibraryTiles,
    getDefaultSection: getDefaultSection,
    loadSections: loadSections,
    destroySections: destroySections,
    pause: pause,
    resume: resume
};

/* eslint-enable indent */
