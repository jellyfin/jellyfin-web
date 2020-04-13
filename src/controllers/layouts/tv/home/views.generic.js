define(['cardBuilder'], function (cardBuilder) {
    'use strict';

    function loadAll(element, apiClient, parentId, autoFocus) {

        var options = {

            UserId: apiClient.getCurrentUserId(),
            ParentId: parentId,
            EnableImageTypes: "Primary,Backdrop,Thumb",
            SortBy: 'SortName'
        };

        return apiClient.getItems(options).then(function (result) {

            var section = element.querySelector('.allSection');

            // Needed in case the view has been destroyed
            if (!section) {
                return;
            }

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'auto',
                autoFocus: autoFocus,
                coverImage: true,
                showTitle: true
            });
        });
    }

    function view(element, apiClient, parentId, autoFocus) {
        var self = this;

        self.loadData = function (isRefresh) {

            if (isRefresh) {
                return Promise.resolve();
            }

            return loadAll(element, apiClient, parentId, autoFocus);
        };

        self.destroy = function () {

        };
    }

    return view;
});
