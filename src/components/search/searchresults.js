import layoutManager from '../layoutManager';
import globalize from '../../scripts/globalize';
import cardBuilder from '../cardbuilder/cardBuilder';
import { appRouter } from '../appRouter';
import '../../elements/emby-scroller/emby-scroller';
import '../../elements/emby-itemscontainer/emby-itemscontainer';
import '../../elements/emby-button/emby-button';
import ServerConnections from '../ServerConnections';
import template from './searchresults.template.html';

/* eslint-disable indent */

    function loadSuggestions(instance, context, apiClient) {
        const options = {

            SortBy: 'IsFavoriteOrLiked,Random',
            IncludeItemTypes: 'Movie,Series,MusicArtist',
            Limit: 20,
            Recursive: true,
            ImageTypeLimit: 0,
            EnableImages: false,
            ParentId: instance.options.parentId,
            EnableTotalRecordCount: false
        };

        apiClient.getItems(apiClient.getCurrentUserId(), options).then(function (result) {
            if (instance.mode !== 'suggestions') {
                result.Items = [];
            }

            const html = result.Items.map(function (i) {
                const href = appRouter.getRouteUrl(i);

                let itemHtml = '<div><a is="emby-linkbutton" class="button-link" style="display:inline-block;padding:.5em 1em;" href="' + href + '">';
                itemHtml += i.Name;
                itemHtml += '</a></div>';
                return itemHtml;
            }).join('');

            const searchSuggestions = context.querySelector('.searchSuggestions');
            searchSuggestions.querySelector('.searchSuggestionsList').innerHTML = html;

            if (result.Items.length) {
                searchSuggestions.classList.remove('hide');
            }
        });
    }

    function getSearchHints(instance, apiClient, query) {
        if (!query.searchTerm) {
            return Promise.resolve({
                SearchHints: []
            });
        }

        let allowSearch = true;

        const queryIncludeItemTypes = query.IncludeItemTypes;

        if (instance.options.collectionType === 'tvshows') {
            if (query.IncludeArtists) {
                allowSearch = false;
            } else if (queryIncludeItemTypes === 'Movie' ||
                queryIncludeItemTypes === 'LiveTvProgram' ||
                queryIncludeItemTypes === 'MusicAlbum' ||
                queryIncludeItemTypes === 'Audio' ||
                queryIncludeItemTypes === 'Book' ||
                queryIncludeItemTypes === 'AudioBook' ||
                queryIncludeItemTypes === 'Playlist' ||
                queryIncludeItemTypes === 'PhotoAlbum' ||
                query.MediaTypes === 'Video' ||
                query.MediaTypes === 'Photo') {
                allowSearch = false;
            }
        } else if (instance.options.collectionType === 'movies') {
            if (query.IncludeArtists) {
                allowSearch = false;
            } else if (queryIncludeItemTypes === 'Series' ||
                queryIncludeItemTypes === 'Episode' ||
                queryIncludeItemTypes === 'LiveTvProgram' ||
                queryIncludeItemTypes === 'MusicAlbum' ||
                queryIncludeItemTypes === 'Audio' ||
                queryIncludeItemTypes === 'Book' ||
                queryIncludeItemTypes === 'AudioBook' ||
                queryIncludeItemTypes === 'Playlist' ||
                queryIncludeItemTypes === 'PhotoAlbum' ||
                query.MediaTypes === 'Video' ||
                query.MediaTypes === 'Photo') {
                allowSearch = false;
            }
        } else if (instance.options.collectionType === 'music') {
            if (query.People) {
                allowSearch = false;
            } else if (queryIncludeItemTypes === 'Series' ||
                queryIncludeItemTypes === 'Episode' ||
                queryIncludeItemTypes === 'LiveTvProgram' ||
                queryIncludeItemTypes === 'Movie') {
                allowSearch = false;
            }
        } else if (instance.options.collectionType === 'livetv') {
            if (query.IncludeArtists || query.IncludePeople) {
                allowSearch = false;
            } else if (queryIncludeItemTypes === 'Series' ||
                queryIncludeItemTypes === 'Episode' ||
                queryIncludeItemTypes === 'MusicAlbum' ||
                queryIncludeItemTypes === 'Audio' ||
                queryIncludeItemTypes === 'Book' ||
                queryIncludeItemTypes === 'AudioBook' ||
                queryIncludeItemTypes === 'PhotoAlbum' ||
                queryIncludeItemTypes === 'Movie' ||
                query.MediaTypes === 'Video' ||
                query.MediaTypes === 'Photo') {
                allowSearch = false;
            }
        }
        if (queryIncludeItemTypes === 'NullType') {
            allowSearch = false;
        }

        if (!allowSearch) {
            return Promise.resolve({
                SearchHints: []
            });
        }

        // Convert the search hint query to a regular item query
        if (apiClient.isMinServerVersion('3.4.1.31')) {
            query.Fields = 'PrimaryImageAspectRatio,CanDelete,BasicSyncInfo,MediaSourceCount';
            query.Recursive = true;
            query.EnableTotalRecordCount = false;
            query.ImageTypeLimit = 1;

            let methodName = 'getItems';

            if (!query.IncludeMedia) {
                if (query.IncludePeople) {
                    methodName = 'getPeople';
                } else if (query.IncludeArtists) {
                    methodName = 'getArtists';
                }
            }

            return apiClient[methodName](apiClient.getCurrentUserId(), query);
        }

        query.UserId = apiClient.getCurrentUserId();

        return apiClient.getSearchHints(query);
    }

    function search(instance, apiClient, context, value) {
        if (value || layoutManager.tv) {
            instance.mode = 'search';
            context.querySelector('.searchSuggestions').classList.add('hide');
        } else {
            instance.mode = 'suggestions';
            loadSuggestions(instance, context, apiClient);
        }

        if (instance.options.collectionType === 'livetv') {
            searchType(instance, apiClient, {
                searchTerm: value,
                IncludePeople: false,
                IncludeMedia: true,
                IncludeGenres: false,
                IncludeStudios: false,
                IncludeArtists: false,
                IncludeItemTypes: 'LiveTvProgram',
                IsMovie: true,
                IsKids: false,
                IsNews: false

            }, context, '.movieResults', {

                preferThumb: true,
                inheritThumb: false,
                shape: (enableScrollX() ? 'overflowPortrait' : 'portrait'),
                showParentTitleOrTitle: true,
                showTitle: false,
                centerText: true,
                coverImage: true,
                overlayText: false,
                overlayMoreButton: true,
                showAirTime: true,
                showAirDateTime: true,
                showChannelName: true
            });
        } else {
            searchType(instance, apiClient, {
                searchTerm: value,
                IncludePeople: false,
                IncludeMedia: true,
                IncludeGenres: false,
                IncludeStudios: false,
                IncludeArtists: false,
                IncludeItemTypes: 'Movie'

            }, context, '.movieResults', {

                showTitle: true,
                overlayText: false,
                centerText: true,
                showYear: true
            });
        }

        searchType(instance, apiClient, {
            searchTerm: value,
            IncludePeople: false,
            IncludeMedia: true,
            IncludeGenres: false,
            IncludeStudios: false,
            IncludeArtists: false,
            IncludeItemTypes: 'Series'

        }, context, '.seriesResults', {

            showTitle: true,
            overlayText: false,
            centerText: true,
            showYear: true
        });

        if (instance.options.collectionType === 'livetv') {
            searchType(instance, apiClient, {
                searchTerm: value,
                IncludePeople: false,
                IncludeMedia: true,
                IncludeGenres: false,
                IncludeStudios: false,
                IncludeArtists: false,
                IncludeItemTypes: 'LiveTvProgram',
                IsSeries: true,
                IsSports: false,
                IsKids: false,
                IsNews: false

            }, context, '.episodeResults', {

                preferThumb: true,
                inheritThumb: false,
                shape: (enableScrollX() ? 'overflowBackdrop' : 'backdrop'),
                showParentTitleOrTitle: true,
                showTitle: false,
                centerText: true,
                coverImage: true,
                overlayText: false,
                overlayMoreButton: true,
                showAirTime: true,
                showAirDateTime: true,
                showChannelName: true
            });
        } else {
            searchType(instance, apiClient, {
                searchTerm: value,
                IncludePeople: false,
                IncludeMedia: true,
                IncludeGenres: false,
                IncludeStudios: false,
                IncludeArtists: false,
                IncludeItemTypes: 'Episode'

            }, context, '.episodeResults', {

                coverImage: true,
                showTitle: true,
                showParentTitle: true
            });
        }

        searchType(instance, apiClient, {
            searchTerm: value,
            IncludePeople: false,
            IncludeMedia: true,
            IncludeGenres: false,
            IncludeStudios: false,
            IncludeArtists: false,
            // NullType to hide
            IncludeItemTypes: instance.options.collectionType === 'livetv' ? 'LiveTvProgram' : 'NullType',
            IsSports: true

        }, context, '.sportsResults', {

            preferThumb: true,
            inheritThumb: false,
            shape: (enableScrollX() ? 'overflowBackdrop' : 'backdrop'),
            showParentTitleOrTitle: true,
            showTitle: false,
            centerText: true,
            coverImage: true,
            overlayText: false,
            overlayMoreButton: true,
            showAirTime: true,
            showAirDateTime: true,
            showChannelName: true

        });

        searchType(instance, apiClient, {
            searchTerm: value,
            IncludePeople: false,
            IncludeMedia: true,
            IncludeGenres: false,
            IncludeStudios: false,
            IncludeArtists: false,
            // NullType to hide
            IncludeItemTypes: instance.options.collectionType === 'livetv' ? 'LiveTvProgram' : 'NullType',
            IsKids: true

        }, context, '.kidsResults', {

            preferThumb: true,
            inheritThumb: false,
            shape: (enableScrollX() ? 'overflowBackdrop' : 'backdrop'),
            showParentTitleOrTitle: true,
            showTitle: false,
            centerText: true,
            coverImage: true,
            overlayText: false,
            overlayMoreButton: true,
            showAirTime: true,
            showAirDateTime: true,
            showChannelName: true

        });

        searchType(instance, apiClient, {
            searchTerm: value,
            IncludePeople: false,
            IncludeMedia: true,
            IncludeGenres: false,
            IncludeStudios: false,
            IncludeArtists: false,
            // NullType to hide
            IncludeItemTypes: instance.options.collectionType === 'livetv' ? 'LiveTvProgram' : 'NullType',
            IsNews: true

        }, context, '.newsResults', {

            preferThumb: true,
            inheritThumb: false,
            shape: (enableScrollX() ? 'overflowBackdrop' : 'backdrop'),
            showParentTitleOrTitle: true,
            showTitle: false,
            centerText: true,
            coverImage: true,
            overlayText: false,
            overlayMoreButton: true,
            showAirTime: true,
            showAirDateTime: true,
            showChannelName: true

        });

        searchType(instance, apiClient, {
            searchTerm: value,
            IncludePeople: false,
            IncludeMedia: true,
            IncludeGenres: false,
            IncludeStudios: false,
            IncludeArtists: false,
            IncludeItemTypes: 'LiveTvProgram',
            IsMovie: instance.options.collectionType === 'livetv' ? false : null,
            IsSeries: instance.options.collectionType === 'livetv' ? false : null,
            IsSports: instance.options.collectionType === 'livetv' ? false : null,
            IsKids: instance.options.collectionType === 'livetv' ? false : null,
            IsNews: instance.options.collectionType === 'livetv' ? false : null

        }, context, '.programResults', {

            preferThumb: true,
            inheritThumb: false,
            shape: (enableScrollX() ? 'overflowBackdrop' : 'backdrop'),
            showParentTitleOrTitle: true,
            showTitle: false,
            centerText: true,
            coverImage: true,
            overlayText: false,
            overlayMoreButton: true,
            showAirTime: true,
            showAirDateTime: true,
            showChannelName: true

        });

        searchType(instance, apiClient, {
            searchTerm: value,
            IncludePeople: false,
            IncludeMedia: true,
            IncludeGenres: false,
            IncludeStudios: false,
            IncludeArtists: false,
            MediaTypes: 'Video',
            ExcludeItemTypes: 'Movie,Episode'

        }, context, '.videoResults', {

            showParentTitle: true,
            showTitle: true,
            overlayText: false,
            centerText: true
        });

        searchType(instance, apiClient, {
            searchTerm: value,
            IncludePeople: true,
            IncludeMedia: false,
            IncludeGenres: false,
            IncludeStudios: false,
            IncludeArtists: false

        }, context, '.peopleResults', {

            coverImage: true,
            showTitle: true
        });

        searchType(instance, apiClient, {
            searchTerm: value,
            IncludePeople: false,
            IncludeMedia: false,
            IncludeGenres: false,
            IncludeStudios: false,
            IncludeArtists: true

        }, context, '.artistResults', {
            coverImage: true,
            showTitle: true
        });

        searchType(instance, apiClient, {
            searchTerm: value,
            IncludePeople: false,
            IncludeMedia: true,
            IncludeGenres: false,
            IncludeStudios: false,
            IncludeArtists: false,
            IncludeItemTypes: 'MusicAlbum'

        }, context, '.albumResults', {

            showParentTitle: true,
            showTitle: true,
            overlayText: false,
            centerText: true
        });

        searchType(instance, apiClient, {
            searchTerm: value,
            IncludePeople: false,
            IncludeMedia: true,
            IncludeGenres: false,
            IncludeStudios: false,
            IncludeArtists: false,
            IncludeItemTypes: 'Audio'

        }, context, '.songResults', {

            showParentTitle: true,
            showTitle: true,
            overlayText: false,
            centerText: true,
            overlayPlayButton: true

        });

        searchType(instance, apiClient, {
            searchTerm: value,
            IncludePeople: false,
            IncludeMedia: true,
            IncludeGenres: false,
            IncludeStudios: false,
            IncludeArtists: false,
            MediaTypes: 'Photo'

        }, context, '.photoResults', {

            showParentTitle: false,
            showTitle: true,
            overlayText: false,
            centerText: true
        });

        searchType(instance, apiClient, {
            searchTerm: value,
            IncludePeople: false,
            IncludeMedia: true,
            IncludeGenres: false,
            IncludeStudios: false,
            IncludeArtists: false,
            IncludeItemTypes: 'PhotoAlbum'

        }, context, '.photoAlbumResults', {

            showTitle: true,
            overlayText: false,
            centerText: true
        });

        searchType(instance, apiClient, {
            searchTerm: value,
            IncludePeople: false,
            IncludeMedia: true,
            IncludeGenres: false,
            IncludeStudios: false,
            IncludeArtists: false,
            IncludeItemTypes: 'Book'

        }, context, '.bookResults', {

            showTitle: true,
            overlayText: false,
            centerText: true

        });

        searchType(instance, apiClient, {
            searchTerm: value,
            IncludePeople: false,
            IncludeMedia: true,
            IncludeGenres: false,
            IncludeStudios: false,
            IncludeArtists: false,
            IncludeItemTypes: 'AudioBook'

        }, context, '.audioBookResults', {

            showTitle: true,
            overlayText: false,
            centerText: true
        });

        searchType(instance, apiClient, {
            searchTerm: value,
            IncludePeople: false,
            IncludeMedia: true,
            IncludeGenres: false,
            IncludeStudios: false,
            IncludeArtists: false,
            IncludeItemTypes: 'Playlist'

        }, context, '.playlistResults', {

            showTitle: true,
            overlayText: false,
            centerText: true
        });
    }

    function searchType(instance, apiClient, query, context, section, cardOptions) {
        query.Limit = enableScrollX() ? 24 : 16;
        query.ParentId = instance.options.parentId;

        getSearchHints(instance, apiClient, query).then(function (result) {
            populateResults(result, context, section, cardOptions);
        });
    }

    function populateResults(result, context, section, cardOptions) {
        section = context.querySelector(section);

        const items = result.Items || result.SearchHints;

        const itemsContainer = section.querySelector('.itemsContainer');

        cardBuilder.buildCards(items, Object.assign({

            itemsContainer: itemsContainer,
            parentContainer: section,
            shape: enableScrollX() ? 'autooverflow' : 'auto',
            scalable: true,
            overlayText: false,
            centerText: true,
            allowBottomPadding: !enableScrollX()

        }, cardOptions || {}));
    }

    function enableScrollX() {
        return true;
    }

    function replaceAll(originalString, strReplace, strWith) {
        const reg = new RegExp(strReplace, 'ig');
        return originalString.replace(reg, strWith);
    }

    function embed(elem, instance) {
        let workingTemplate = template;
        if (!enableScrollX()) {
            workingTemplate = replaceAll(workingTemplate, 'data-horizontal="true"', 'data-horizontal="false"');
            workingTemplate = replaceAll(workingTemplate, 'itemsContainer scrollSlider', 'itemsContainer scrollSlider vertical-wrap');
        }

        const html = globalize.translateHtml(workingTemplate, 'core');

        elem.innerHTML = html;

        elem.classList.add('searchResults');
        instance.search('');
    }

class SearchResults {
    constructor(options) {
        this.options = options;
        embed(options.element, this);
    }
    search(value) {
        const apiClient = ServerConnections.getApiClient(this.options.serverId);

        search(this, apiClient, this.options.element, value);
    }
    destroy() {
        const options = this.options;
        if (options) {
            options.element.classList.remove('searchFields');
        }
        this.options = null;
    }
}

export default SearchResults;

/* eslint-enable indent */
