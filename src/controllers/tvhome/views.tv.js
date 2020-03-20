define(['./spotlight', 'focusManager', 'cardBuilder'], function (spotlight, focusManager, cardBuilder) {
    'use strict';

    function loadResume(element, apiClient, parentId) {

        var options = {

            Limit: 6,
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return apiClient.getResumableItems(apiClient.getCurrentUserId(), options).then(function (result) {

            var section = element.querySelector('.resumeSection');

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'backdrop',
                rows: 3,
                preferThumb: true,
                scalable: false
            });
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

    function loadNextUp(element, apiClient, parentId) {

        var options = {

            UserId: apiClient.getCurrentUserId(),
            Fields: "PrimaryImageAspectRatio",
            ImageTypeLimit: 1,
            Limit: 18,
            ParentId: parentId,
            EnableTotalRecordCount: false
        };

        return apiClient.getNextUpEpisodes(options).then(function (result) {

            var section = element.querySelector('.nextUpSection');

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'backdrop',
                rows: 3,
                preferThumb: true,
                scalable: false
            });
        });
    }

    function loadLatest(element, apiClient, parentId) {

        var options = {

            IncludeItemTypes: "Episode",
            Limit: 12,
            Fields: "PrimaryImageAspectRatio",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return apiClient.getLatestItems(options).then(function (result) {

            var section = element.querySelector('.latestSection');

            cardBuilder.buildCards(result, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'backdrop',
                rows: 3,
                preferThumb: true,
                showGroupCount: true,
                scalable: false
            });
        });
    }

    function loadSpotlight(instance, element, apiClient, parentId) {

        var options = {

            SortBy: "Random",
            IncludeItemTypes: "Series",
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

    function loadImages(element, apiClient, parentId) {

        return apiClient.getItems(apiClient.getCurrentUserId(), {

            SortBy: "IsFavoriteOrLiked,Random",
            IncludeItemTypes: "Series",
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
                element.querySelector('.tvFavoritesCard .cardImage').style.backgroundImage = "url('" + Emby.Models.backdropImageUrl(items[0], imgOptions) + "')";
            }

            if (items.length > 1) {
                element.querySelector('.allSeriesCard .cardImage').style.backgroundImage = "url('" + Emby.Models.backdropImageUrl(items[1], imgOptions) + "')";
            }
        });
    }

    function view(element, apiClient, parentId, autoFocus) {

        var self = this;

        if (autoFocus) {
            focusManager.autoFocus(element);
        }

        self.loadData = function () {

            return Promise.all([
                loadResume(element, apiClient, parentId),
                loadNextUp(element, apiClient, parentId),
                loadLatest(element, apiClient, parentId)
            ]);
        };

        loadSpotlight(self, element, apiClient, parentId);
        loadImages(element, apiClient, parentId);

        var serverId = apiClient.serverId();
        element.querySelector('.allSeriesCard').addEventListener('click', function () {
            Emby.Page.show('/tv.html?serverId=' + apiClient.serverId() + '&tab=0&parentId=' + parentId);
        });

        element.querySelector('.tvUpcomingCard').addEventListener('click', function () {
            Emby.Page.show('/tv.html?serverId=' + apiClient.serverId() + '&tab=3&parentId=' + parentId);
        });

        element.querySelector('.tvFavoritesCard').addEventListener('click', function () {
            Emby.Page.show('/tv.html?serverId=' + apiClient.serverId() + '&tab=4&parentId=' + parentId);
        });

        self.destroy = function () {

        };
        bindFlipEvents(element.querySelector('.nextUpSection'));
        bindFlipEvents(element.querySelector('.resumeSection'));
    }

    function bindFlipEvents(element) {

        element.addEventListener('focus', function (e) {

            var card = parentWithClass(e.target, 'card');

            if (card) {
                startCardFlipTimer(card);
            }

        }, true);
    }

    var cardFlipTimer;
    function startCardFlipTimer(card) {

        if (cardFlipTimer) {
            clearTimeout(cardFlipTimer);
            cardFlipTimer = null;
        }

        if (card.querySelector('.cardRevealContent')) {
            // Already flipped
            return;
        }

        // It doesn't have an image
        if (!card.querySelector('.primaryImageTag')) {
            return;
        }

        cardFlipTimer = setTimeout(function () {
            flipCard(card);
        }, 3000);
    }

    function flipCard(card) {

        if (document.activeElement != card) {
            return;
        }

        if (card.querySelector('.cardRevealContent')) {
            // Already flipped
            return;
        }

        // Also cancel if not in document

        var cardImageContainer = card.querySelector('.cardImageContainer');

        var newCardImageContainer = document.createElement('div');
        newCardImageContainer.classList.add('cardImage');
        newCardImageContainer.classList.add('coveredImage');
        newCardImageContainer.classList.add('cardRevealContent');

        var imgUrl = Emby.Models.imageUrl(card.getAttribute('data-id'), {
            tag: card.querySelector('.primaryImageTag').value,
            type: 'Primary',
            maxWidth: 400
        });

        newCardImageContainer.style.backgroundImage = "url('" + imgUrl + "')";
        newCardImageContainer.classList.add('hide');
        cardImageContainer.appendChild(newCardImageContainer);

        flipElementWithDuration(card, 600, function () {
            newCardImageContainer.classList.remove('hide');

            setTimeout(function () {
                newCardImageContainer.parentNode.removeChild(newCardImageContainer);
            }, 4000);
        });
    }

    function flipElementWithDuration(elem, duration, callback) {

        if (!elem.animate) {

            callback();
            return;
        }

        elem.style.transform = 'perspective(400px) rotate3d(1, 0, 0, -180deg)';

        // Switch to SequenceEffect once that api is a little more mature
        var keyframes = [
            { transform: 'perspective(400px) ', offset: 0 },
            { transform: 'perspective(400px) rotate3d(1, 0, 0, -180deg)', offset: 1 }];

        var timing = { duration: duration, iterations: 1, easing: 'ease-in' };
        elem.animate(keyframes, timing).onfinish = function () {
            callback();
            elem.style.transform = '';
        };
    }

    return view;

});
