define(['cardBuilder'], function (cardBuilder) {
    'use strict';

    function loadAll(element, apiClient, parentId, autoFocus) {

        var options = {

            ParentId: parentId,
            IncludeItemTypes: "BoxSet",
            EnableImageTypes: "Primary,Backdrop,Thumb",
            SortBy: 'SortName'
        };

        return apiClient.getItems(apiClient.getCurrentUserId(), options).then(function (result) {

            var section = element.querySelector('.allSection');

            if (!section) {
                return;
            }

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'auto',
                autoFocus: autoFocus,
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 3
                },
                scalable: false
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
