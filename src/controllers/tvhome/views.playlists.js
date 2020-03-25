define(['connectionManager', 'cardBuilder'], function (connectionManager, cardBuilder) {
    'use strict';

    function playlists(options) {

        options = options || {};
        options.parentId = null;
        delete options.parentId;
        options.recursive = true;

        return new Promise(function (resolve, reject) {

            var apiClient = connectionManager.currentApiClient();

            options.IncludeItemTypes = "Playlist";
            normalizeOptions(options);

            apiClient.getJSON(apiClient.getUrl('Users/' + apiClient.getCurrentUserId() + '/Items', options)).then(resolve, reject);
        });
    }

    function normalizeOptions(options) {

        // Just put this on every query
        options.Fields = options.Fields ? (options.Fields + ",PrimaryImageAspectRatio") : "PrimaryImageAspectRatio";
        options.ImageTypeLimit = 1;
    }

    function loadAll(element, parentId, autoFocus) {

        var options = {

            ParentId: parentId,
            EnableImageTypes: "Primary,Backdrop,Thumb",
            SortBy: 'SortName'
        };

        return playlists(options).then(function (result) {

            var section = element.querySelector('.allSection');

            if (!section) {
                return;
            }

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'auto',
                autoFocus: autoFocus,
                showTitle: true,
                overlayText: true,
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 3
                },
                scalable: false
            });
        });
    }

    function view(element, parentId, autoFocus) {
        var self = this;

        self.loadData = function (isRefresh) {

            if (isRefresh) {
                return Promise.resolve();
            }

            return loadAll(element, parentId, autoFocus);
        };

        self.destroy = function () {

        };
    }

    return view;
});
