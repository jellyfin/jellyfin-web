define(['visibleinviewport', 'itemShortcuts', 'browser', 'connectionManager'], function (visibleinviewport, itemShortcuts, browser, connectionManager) {
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

    function loadItemIntoSpotlight(card, item, width) {

        if (!item.BackdropImageTags || !item.BackdropImageTags.length) {
            return;
        }

        if (document.activeElement === card) {
            card.dispatchEvent(new CustomEvent("focus"));
        }

        var imgUrl = backdropImageUrl(item, {
            maxWidth: width
        });

        var cardImageContainer = card.querySelector('.cardImage');

        var newCardImageContainer = document.createElement('div');
        newCardImageContainer.className = cardImageContainer.className;

        newCardImageContainer.style.backgroundImage = "url('" + imgUrl + "')";

        card.querySelector('.cardText').innerHTML = item.Name;
        card.setAttribute('data-id', item.Id);
        card.setAttribute('data-serverid', item.ServerId);
        card.setAttribute('data-type', item.Type);
        card.setAttribute('data-isfolder', item.IsFolder.toString());
        card.setAttribute('data-action', 'link');
        card.classList.add('itemAction');

        cardImageContainer.parentNode.appendChild(newCardImageContainer);

        var onAnimationFinished = function () {

            var parentNode = cardImageContainer.parentNode;
            if (parentNode) {
                parentNode.removeChild(cardImageContainer);
            }
        };

        if (browser.animate ) {
            var keyframes = [{
                opacity: '0',
                offset: 0
            },
            {
                opacity: '1',
                offset: 1
            }
            ];
            var timing = {
                duration: 900,
                iterations: 1
            };
            newCardImageContainer.animate(keyframes, timing).onfinish = onAnimationFinished;
        } else {
            onAnimationFinished();
        }
    }

    function spotlight(card, items, width) {

        var self = this;

        itemShortcuts.on(card);

        self.items = items;
        self.card = card;
        self.width = width;

        self.start();
    }

    spotlight.prototype.start = function () {

        var self = this;
        var items = self.items;
        var card = self.card;
        var width = self.width;

        if (!items.length) {
            return;
        }

        loadItemIntoSpotlight(card, items[0], width);

        if (items.length === 1) {
            return;
        }

        if (browser.slow) {
            return;
        }

        self.index = 1;
        var intervalMs = browser.animate ? 10000 : 30000;

        self.interval = setInterval(self.onInterval.bind(self), intervalMs);
    };

    spotlight.prototype.onInterval = function () {

        var self = this;
        var items = self.items;
        var card = self.card;
        var width = self.width;

        if (!document.body.contains(card)) {
            clearInterval(self.interval);
            return;
        }

        if (!visibleinviewport(card, false, 0)) {
            return;
        }

        if (self.index >= items.length) {
            self.index = 0;
        }

        loadItemIntoSpotlight(card, items[self.index], width);
        self.index++;
    };

    spotlight.prototype.destroy = function () {

        var self = this;

        itemShortcuts.off(self.card);

        if (self.interval) {
            clearInterval(self.interval);
        }

        self.interval = null;
        self.items = null;
        self.card = null;
    };

    return spotlight;
});
