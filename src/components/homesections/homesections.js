define(['connectionManager', 'cardBuilder', 'appSettings', 'dom', 'apphost', 'layoutManager', 'imageLoader', 'globalize', 'itemShortcuts', 'itemHelper', 'appRouter', 'scripts/imagehelper','paper-icon-button-light', 'emby-itemscontainer', 'emby-scroller', 'emby-button', 'css!./homesections'], function (connectionManager, cardBuilder, appSettings, dom, appHost, layoutManager, imageLoader, globalize, itemShortcuts, itemHelper, appRouter, imageHelper) {
    'use strict';

    function getDefaultSection(index) {
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
        var sections = [];
        for (var i = 0, length = sectionCount; i < length; i++) {
            var section = userSettings.get('homesection' + i) || getDefaultSection(i);
            if (section === 'folders') {
                section = getDefaultSection(0);
            }

            sections.push(section);
        }

        return sections;
    }

    function loadSections(elem, apiClient, user, userSettings) {
        return getUserViews(apiClient, user.Id).then(function (userViews) {
            var html = '';

            var sectionCount = 7;
            for (var i = 0; i < sectionCount; i++) {
                html += '<div class="verticalSection section' + i + '"></div>';
            }

            elem.innerHTML = html;
            elem.classList.add('homeSectionsContainer');

            var promises = [];
            var sections = getAllSectionsToShow(userSettings, sectionCount);
            for (var i = 0; i < sections.length; i++) {
                promises.push(loadSection(elem, apiClient, user, userSettings, userViews, sections, i));
            }

            return Promise.all(promises).then(function () {
                return resume(elem, {
                    refresh: true,
                    returnPromise: false
                });
            });
        });
    }

    function destroySections(elem) {
        var elems = elem.querySelectorAll('.itemsContainer');
        for (var i = 0; i < elems.length; i++) {
            elems[i].fetchData = null;
            elems[i].parentContainer = null;
            elems[i].getItemsHtml = null;
        }

        elem.innerHTML = '';
    }

    function pause(elem) {
        var elems = elem.querySelectorAll('.itemsContainer');
        for (var i = 0; i < elems.length; i++) {
            elems[i].pause();
        }
    }

    function resume(elem, options) {
        var elems = elem.querySelectorAll('.itemsContainer');
        var i, length;
        var promises = [];

        for (i = 0, length = elems.length; i < length; i++) {
            promises.push(elems[i].resume(options));
        }

        var promise = Promise.all(promises);
        if (!options || options.returnPromise !== false) {
            return promise;
        }
    }

    function loadSection(page, apiClient, user, userSettings, userViews, allSections, index) {

        var section = allSections[index];
        var userId = user.Id;

        var elem = page.querySelector('.section' + index);

        if (section === 'latestmedia') {
            loadRecentlyAdded(elem, apiClient, user, userViews);
        } else if (section === 'librarytiles' || section === 'smalllibrarytiles' || section === 'smalllibrarytiles-automobile' || section === 'librarytiles-automobile') {
            loadLibraryTiles(elem, apiClient, user, userSettings, 'smallBackdrop', userViews, allSections);
        } else if (section === 'librarybuttons') {
            loadlibraryButtons(elem, apiClient, user, userSettings, userViews, allSections);
        } else if (section === 'resume') {
            loadResumeVideo(elem, apiClient, userId);
        } else if (section === 'resumeaudio') {
            loadResumeAudio(elem, apiClient, userId);
        } else if (section === 'activerecordings') {
            loadLatestLiveTvRecordings(elem, true, apiClient, userId);
        } else if (section === 'nextup') {
            loadNextUp(elem, apiClient, userId);
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
        return enableScrollX() ? 'autooverflow' : 'auto';
    }

    function getLibraryButtonsHtml(items) {
        var html = "";

        html += '<div class="verticalSection verticalSection-extrabottompadding">';
        html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate('HeaderMyMedia') + '</h2>';

        html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x" data-multiselect="false">';

        // library card background images
        for (var i = 0, length = items.length; i < length; i++) {
            var item = items[i];
            var icon = imageHelper.getLibraryIcon(item.CollectionType);
            html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl(item) + '" class="raised homeLibraryButton"><i class="md-icon homeLibraryIcon">' + icon + '</i><span class="homeLibraryText">' + item.Name + '</span></a>';
        }

        html += '</div>';
        html += '</div>';

        return html;
    }

    function loadlibraryButtons(elem, apiClient, user, userSettings, userViews) {
        elem.classList.remove('verticalSection');
        var html = getLibraryButtonsHtml(userViews);

        elem.innerHTML = html;
        imageLoader.lazyChildren(elem);
    }

    /**
     * Returns a random integer between min (inclusive) and max (inclusive)
     * Using Math.round() will give you a non-uniform distribution!
     */
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getFetchLatestItemsFn(serverId, parentId, collectionType) {
        return function () {
            var apiClient = connectionManager.getApiClient(serverId);
            var limit = 16;

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

            var options = {
                Limit: limit,
                Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
                ImageTypeLimit: 1,
                EnableImageTypes: "Primary,Backdrop,Thumb",
                ParentId: parentId
            };

            return apiClient.getLatestItems(options);
        };
    }

    function getLatestItemsHtmlFn(itemType, viewType) {
        return function (items) {
            var cardLayout = false;
            var shape;
            if (itemType === 'Channel' || viewType === 'movies' || viewType === 'books') {
                shape = getPortraitShape();
            } else if (viewType === 'music') {
                shape = getSquareShape();
            } else {
                shape = getThumbShape();
            }

            return cardBuilder.getCardsHtml({
                items: items,
                shape: shape,
                preferThumb: viewType !== 'movies' && itemType !== 'Channel' && viewType !== 'music' ? 'auto' : null,
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
        var html = '';

        html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
        if (!layoutManager.tv) {
            html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl(parent, {
                section: 'latest'
            }) + '" class="more button-flat button-flat-mini sectionTitleTextButton">';
            html += '<h2 class="sectionTitle sectionTitle-cards">';
            html += globalize.translate('LatestFromLibrary', parent.Name);
            html += '</h2>';
            html += '<i class="md-icon">&#xE5CC;</i>';
            html += '</a>';
        } else {
            html += '<h2 class="sectionTitle sectionTitle-cards">' + globalize.translate('LatestFromLibrary', parent.Name) + '</h2>';
        }
        html += '</div>';

        if (enableScrollX()) {
            html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true">';
            html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x">';
        } else {
            html += '<div is="emby-itemscontainer" class="itemsContainer focuscontainer-x padded-left padded-right vertical-wrap">';
        }

        if (enableScrollX()) {
            html += '</div>';
        }
        html += '</div>';

        elem.innerHTML = html;

        var itemsContainer = elem.querySelector('.itemsContainer');
        itemsContainer.fetchData = getFetchLatestItemsFn(apiClient.serverId(), parent.Id, parent.CollectionType);
        itemsContainer.getItemsHtml = getLatestItemsHtmlFn(parent.Type, parent.CollectionType);
        itemsContainer.parentContainer = elem;
    }

    function loadRecentlyAdded(elem, apiClient, user, userViews) {
        elem.classList.remove('verticalSection');
        var excludeViewTypes = ['playlists', 'livetv', 'boxsets', 'channels'];

        for (var i = 0, length = userViews.length; i < length; i++) {
            var item = userViews[i];
            if (user.Configuration.LatestItemsExcludes.indexOf(item.Id) !== -1) {
                continue;
            }

            if (excludeViewTypes.indexOf(item.CollectionType || []) !== -1) {
                continue;
            }

            var frag = document.createElement('div');
            frag.classList.add('verticalSection');
            frag.classList.add('hide');
            elem.appendChild(frag);

            renderLatestSection(frag, apiClient, user, item);
        }
    }

    function getRequirePromise(deps) {
        return new Promise(function (resolve, reject) {
            require(deps, resolve);
        });
    }

    function loadLibraryTiles(elem, apiClient, user, userSettings, shape, userViews, allSections) {
        var html = '';
        if (userViews.length) {
            html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate('HeaderMyMedia') + '</h2>';
            if (enableScrollX()) {
                html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true">';
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
            var apiClient = connectionManager.getApiClient(serverId);
            var screenWidth = dom.getWindowSize().innerWidth;

            var limit;
            if (enableScrollX()) {
                limit = 12;
            } else {
                limit = screenWidth >= 1920 ? 8 : (screenWidth >= 1600 ? 8 : (screenWidth >= 1200 ? 9 : 6));
                limit = Math.min(limit, 5);
            }

            var options = {
                Limit: limit,
                Recursive: true,
                Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
                ImageTypeLimit: 1,
                EnableImageTypes: "Primary,Backdrop,Thumb",
                EnableTotalRecordCount: false,
                MediaTypes: 'Video'
            };

            return apiClient.getResumableItems(apiClient.getCurrentUserId(), options);
        };
    }

    function getContinueWatchingItemsHtml(items) {
        var cardLayout = false;
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

    function loadResumeVideo(elem, apiClient, userId) {
        var html = '';

        html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate('HeaderContinueWatching') + '</h2>';
        if (enableScrollX()) {
            html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true">';
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

        var itemsContainer = elem.querySelector('.itemsContainer');
        itemsContainer.fetchData = getContinueWatchingFetchFn(apiClient.serverId());
        itemsContainer.getItemsHtml = getContinueWatchingItemsHtml;
        itemsContainer.parentContainer = elem;
    }

    function getContinueListeningFetchFn(serverId) {
        return function () {
            var apiClient = connectionManager.getApiClient(serverId);
            var screenWidth = dom.getWindowSize().innerWidth;

            var limit;
            if (enableScrollX()) {
                limit = 12;
            } else {
                limit = screenWidth >= 1920 ? 8 : (screenWidth >= 1600 ? 8 : (screenWidth >= 1200 ? 9 : 6));
                limit = Math.min(limit, 5);
            }

            var options = {
                Limit: limit,
                Recursive: true,
                Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
                ImageTypeLimit: 1,
                EnableImageTypes: "Primary,Backdrop,Thumb",
                EnableTotalRecordCount: false,
                MediaTypes: 'Audio'
            };

            return apiClient.getResumableItems(apiClient.getCurrentUserId(), options);
        };
    }

    function getContinueListeningItemsHtml(items) {
        var cardLayout = false;
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

    function loadResumeAudio(elem, apiClient, userId) {
        var html = '';

        html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate('HeaderContinueWatching') + '</h2>';
        if (enableScrollX()) {
            html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true">';
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

        var itemsContainer = elem.querySelector('.itemsContainer');
        itemsContainer.fetchData = getContinueListeningFetchFn(apiClient.serverId());
        itemsContainer.getItemsHtml = getContinueListeningItemsHtml;
        itemsContainer.parentContainer = elem;
    }

    function getOnNowFetchFn(serverId) {
        return function () {
            var apiClient = connectionManager.getApiClient(serverId);
            return apiClient.getLiveTvRecommendedPrograms({
                userId: apiClient.getCurrentUserId(),
                IsAiring: true,
                limit: 24,
                ImageTypeLimit: 1,
                EnableImageTypes: "Primary,Thumb,Backdrop",
                EnableTotalRecordCount: false,
                Fields: "ChannelInfo,PrimaryImageAspectRatio"
            });
        };
    }

    function getOnNowItemsHtml(items) {
        var cardLayout = false;
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

        var userId = user.Id;
        return apiClient.getLiveTvRecommendedPrograms({
            userId: apiClient.getCurrentUserId(),
            IsAiring: true,
            limit: 1,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Thumb,Backdrop",
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo,PrimaryImageAspectRatio"
        }).then(function (result) {
            var html = '';
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
                    html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true" data-scrollbuttons="false">';
                    html += '<div class="padded-left padded-right padded-top padded-bottom scrollSlider focuscontainer-x">';
                } else {
                    html += '<div class="padded-left padded-right padded-top padded-bottom focuscontainer-x">';
                }

                html += '<a style="margin-left:.8em;margin-right:0;" is="emby-linkbutton" href="' + appRouter.getRouteUrl('livetv', {
                    serverId: apiClient.serverId(),
					section: 'programs'
                }) + '" class="raised"><span>' + globalize.translate('Programs') + '</span></a>';

                html += '<a style="margin-left:.5em;margin-right:0;" is="emby-linkbutton" href="' + appRouter.getRouteUrl('livetv', {
                    serverId: apiClient.serverId(),
                    section: 'guide'
                }) + '" class="raised"><span>' + globalize.translate('Guide') + '</span></a>';

                html += '<a style="margin-left:.5em;margin-right:0;" is="emby-linkbutton" href="' + appRouter.getRouteUrl('recordedtv', {
                    serverId: apiClient.serverId()
                }) + '" class="raised"><span>' + globalize.translate('Recordings') + '</span></a>';

                html += '<a style="margin-left:.5em;margin-right:0;" is="emby-linkbutton" href="' + appRouter.getRouteUrl('livetv', {
                    serverId: apiClient.serverId(),
                    section: 'dvrschedule'
                }) + '" class="raised"><span>' + globalize.translate('Schedule') + '</span></a>';

                html += '<a style="margin-left:.5em;margin-right:0;" is="emby-linkbutton" href="' + appRouter.getRouteUrl('livetv', {
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
                    html += '<i class="md-icon">&#xE5CC;</i>';
                    html += '</a>';

                } else {
                    html += '<h2 class="sectionTitle sectionTitle-cards">' + globalize.translate('HeaderOnNow') + '</h2>';
                }
                html += '</div>';

                if (enableScrollX()) {
                    html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true">';
                    html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x">'
                } else {
                    html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x">';
                }

                if (enableScrollX()) {
                    html += '</div>';
                }

                html += '</div>';
                html += '</div>';

                elem.innerHTML = html;

                var itemsContainer = elem.querySelector('.itemsContainer');
                itemsContainer.parentContainer = elem;
                itemsContainer.fetchData = getOnNowFetchFn(apiClient.serverId());
                itemsContainer.getItemsHtml = getOnNowItemsHtml;
            }
        });
    }

    function getNextUpFetchFn(serverId) {
        return function () {
            var apiClient = connectionManager.getApiClient(serverId);
            return apiClient.getNextUpEpisodes({
                Limit: enableScrollX() ? 24 : 15,
                Fields: "PrimaryImageAspectRatio,SeriesInfo,DateCreated,BasicSyncInfo",
                UserId: apiClient.getCurrentUserId(),
                ImageTypeLimit: 1,
                EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
                EnableTotalRecordCount: false
            });
        };
    }

    function getNextUpItemsHtml(items) {
        var cardLayout = false;
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

    function loadNextUp(elem, apiClient, userId) {
        var html = '';

        html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
        if (!layoutManager.tv) {
            html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl('nextup', {
                serverId: apiClient.serverId()
            }) + '" class="button-flat button-flat-mini sectionTitleTextButton">';
            html += '<h2 class="sectionTitle sectionTitle-cards">';
            html += globalize.translate('HeaderNextUp');
            html += '</h2>';
            html += '<i class="md-icon">&#xE5CC;</i>';
            html += '</a>';
        } else {
            html += '<h2 class="sectionTitle sectionTitle-cards">' + globalize.translate('HeaderNextUp') + '</h2>';
        }
        html += '</div>';

        if (enableScrollX()) {
            html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true">';
            html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x" data-monitor="videoplayback,markplayed">'
        } else {
            html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x" data-monitor="videoplayback,markplayed">';
        }

        if (enableScrollX()) {
            html += '</div>';
        }
        html += '</div>';

        elem.classList.add('hide');
        elem.innerHTML = html;

        var itemsContainer = elem.querySelector('.itemsContainer');
        itemsContainer.fetchData = getNextUpFetchFn(apiClient.serverId());
        itemsContainer.getItemsHtml = getNextUpItemsHtml;
        itemsContainer.parentContainer = elem;
    }

    function getLatestRecordingsFetchFn(serverId, activeRecordingsOnly) {
        return function () {
            var apiClient = connectionManager.getApiClient(serverId);
            return apiClient.getLiveTvRecordings({
                userId: apiClient.getCurrentUserId(),
                Limit: enableScrollX() ? 12 : 5,
                Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
                EnableTotalRecordCount: false,
                IsLibraryItem: activeRecordingsOnly ? null : false,
                IsInProgress: activeRecordingsOnly ? true : null
            });
        };
    }

    function getLatestRecordingItemsHtml(activeRecordingsOnly) {
        return function (items) {
            var cardLayout = false;
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

    function loadLatestLiveTvRecordings(elem, activeRecordingsOnly, apiClient, userId) {
        var title = activeRecordingsOnly ?
            globalize.translate('HeaderActiveRecordings') :
            globalize.translate('HeaderLatestRecordings');

        var html = '';

        html += '<div class="sectionTitleContainer sectionTitleContainer-cards">';
        html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + title + '</h2>';
        html += '</div>';

        if (enableScrollX()) {
            html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true">';
            html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x">'
        } else {
            html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x">';
        }

        if (enableScrollX()) {
            html += '</div>';
        }
        html += '</div>';

        elem.classList.add('hide');
        elem.innerHTML = html;

        var itemsContainer = elem.querySelector('.itemsContainer');
        itemsContainer.fetchData = getLatestRecordingsFetchFn(apiClient.serverId(), activeRecordingsOnly);
        itemsContainer.getItemsHtml = getLatestRecordingItemsHtml(activeRecordingsOnly);
        itemsContainer.parentContainer = elem;
    }

    return {
        loadLibraryTiles: loadLibraryTiles,
        getDefaultSection: getDefaultSection,
        loadSections: loadSections,
        destroySections: destroySections,
        pause: pause,
        resume: resume
    };
});
