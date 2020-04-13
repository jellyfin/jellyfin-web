define(['connectionManager', 'globalize', './spotlight', 'imageLoader', 'focusManager', 'cardBuilder', 'emby-itemscontainer'], function (connectionManager, globalize, spotlight, imageLoader, focusManager, cardbuilder) {
    'use strict';

    function backdropImageUrl(item, options) {

        var apiClient = connectionManager.getApiClient(item.ServerId);

        options = options || {};
        options.type = options.type || "Backdrop";

        options.width = null;
        delete options.width;
        options.maxWidth = null;
        delete options.maxWidth;
        options.maxHeight = null;
        delete options.maxHeight;
        options.height = null;
        delete options.height;

        // If not resizing, get the original image
        if (!options.maxWidth && !options.width && !options.maxHeight && !options.height) {
            options.quality = 100;
            options.format = 'jpg';
        }

        if (item.BackdropImageTags && item.BackdropImageTags.length) {

            options.tag = item.BackdropImageTags[0];
            return apiClient.getScaledImageUrl(item.Id, options);
        }

        return null;
    }

    function loadResume(element, apiClient, parentId) {

        var options = {

            Limit: 6,
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return apiClient.getResumableItems(apiClient.getCurrentUserId(), options).then(function (result) {

            var resumeSection = element.querySelector('.resumeSection');

            cardbuilder.buildCards(result.Items, {
                parentContainer: resumeSection,
                itemsContainer: resumeSection.querySelector('.itemsContainer'),
                shape: 'backdrop',
                rows: 3,
                preferThumb: true,
                scalable: false
            });
        });
    }

    function loadLatest(element, apiClient, parentId) {

        var options = {

            IncludeItemTypes: "Movie",
            Limit: 12,
            ParentId: parentId,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return apiClient.getLatestItems(options).then(function (result) {

            var resumeSection = element.querySelector('.latestSection');

            cardbuilder.buildCards(result, {
                parentContainer: resumeSection,
                itemsContainer: resumeSection.querySelector('.itemsContainer'),
                shape: 'portrait',
                rows: 2,
                scalable: false
            });
        });
    }

    function loadSpotlight(instance, element, apiClient, parentId) {

        var options = {

            SortBy: "Random",
            IncludeItemTypes: "Movie",
            Limit: 20,
            Recursive: true,
            ParentId: parentId,
            EnableImageTypes: "Backdrop",
            ImageTypes: "Backdrop",
            Fields: "Taglines"
        };

        return apiClient.getItems(apiClient.getCurrentUserId(), options).then(function (result) {

            var card = element.querySelector('.wideSpotlightCard');

            instance.spotlight = new spotlight(card, result.Items, 767);
        });
    }

    function loadRecommendations(element, apiClient) {

        return apiClient.getMovieRecommendations({

            UserId: apiClient.getCurrentUserId(),
            categoryLimit: 4,
            ItemLimit: 8,
            ImageTypeLimit: 1,
            Fields: "PrimaryImageAspectRatio"

        }).then(function (recommendations) {

            var values = recommendations.map(getRecommendationHtml);

            var recs = element.querySelector('.recommendations');

            if (recs) {
                recs.innerHTML = '<div class="horizontalSectionsContainer">' + values.join('') + '</div>';

                imageLoader.lazyChildren(recs);
            }
        });
    }

    function getRecommendationHtml(recommendation) {

        var cardsHtml = cardbuilder.getCardsHtml(recommendation.Items, {
            shape: 'portrait',
            rows: 2,
            scalable: false
        });

        var html = '';

        var title = '';

        switch (recommendation.RecommendationType) {

            case 'SimilarToRecentlyPlayed':
                title = globalize.translate('RecommendationBecauseYouWatched').replace("{0}", recommendation.BaselineItemName);
                break;
            case 'SimilarToLikedItem':
                title = globalize.translate('RecommendationBecauseYouLike').replace("{0}", recommendation.BaselineItemName);
                break;
            case 'HasDirectorFromRecentlyPlayed':
            case 'HasLikedDirector':
                title = globalize.translate('RecommendationDirectedBy').replace("{0}", recommendation.BaselineItemName);
                break;
            case 'HasActorFromRecentlyPlayed':
            case 'HasLikedActor':
                title = globalize.translate('RecommendationStarring').replace("{0}", recommendation.BaselineItemName);
                break;
        }

        html += '<div class="horizontalSection">';
        html += '<div class="sectionTitle">' + title + '</div>';

        html += '<div is="emby-itemscontainer" class="itemsContainer">';

        html += cardsHtml;

        html += '</div>';
        html += '</div>';

        return html;
    }

    function loadImages(element, apiClient, parentId) {

        return apiClient.getItems(apiClient.getCurrentUserId(), {

            SortBy: "IsFavoriteOrLiked,Random",
            IncludeItemTypes: "Movie",
            Limit: 2,
            Recursive: true,
            ParentId: parentId,
            EnableImageTypes: "Backdrop",
            ImageTypes: "Backdrop"

        }).then(function (result) {

            var items = result.Items;
            var imgOptions = {
                maxWidth: 600
            };

            if (items.length > 0) {
                element.querySelector('.movieFavoritesCard .cardImage').style.backgroundImage = "url('" + backdropImageUrl(items[0], imgOptions) + "')";
            }

            if (items.length > 1) {
                element.querySelector('.allMoviesCard .cardImage').style.backgroundImage = "url('" + backdropImageUrl(items[1], imgOptions) + "')";
            }
        });
    }

    function view(element, apiClient, parentId, autoFocus) {

        var self = this;

        if (autoFocus) {
            focusManager.autoFocus(element);
        }

        self.loadData = function (isRefresh) {

            var promises = [
                loadResume(element, apiClient, parentId),
                loadLatest(element, apiClient, parentId)
            ];

            if (!isRefresh) {
                promises.push(loadRecommendations(element, apiClient, parentId));
            }

            return Promise.all(promises);
        };
        loadSpotlight(self, element, apiClient, parentId);
        loadImages(element, apiClient, parentId);

        element.querySelector('.allMoviesCard').addEventListener('click', function () {
            Emby.Page.show('/movies.html?tab=0&parentId=' + parentId);
        });

        element.querySelector('.movieCollectionsCard').addEventListener('click', function () {
            Emby.Page.show('/movies.html?tab=4&parentId=' + parentId);
        });

        element.querySelector('.movieFavoritesCard').addEventListener('click', function () {
            Emby.Page.show('/movies.html?tab=3&parentId=' + parentId);
        });

        self.destroy = function () {
            if (self.spotlight) {
                self.spotlight.destroy();
                self.spotlight = null;
            }
        };
    }

    return view;

});
