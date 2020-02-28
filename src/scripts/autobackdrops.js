define(["backdrop", "userSettings", "libraryMenu"], function (backdrop, userSettings, libraryMenu) {
    "use strict";

    function enabled() {
        return userSettings.enableBackdrops();
    }

    function getBackdropItemIds(apiClient, userId, types, parentId) {
        var key = "backdrops2_" + userId + (types || "") + (parentId || "");
        var data = cache[key];

        if (data) {
            console.debug("Found backdrop id list in cache. Key: " + key);
            data = JSON.parse(data);
            return Promise.resolve(data);
        }

        var options = {
            SortBy: "IsFavoriteOrLiked,Random",
            Limit: 20,
            Recursive: true,
            IncludeItemTypes: types,
            ImageTypes: "Backdrop",
            ParentId: parentId,
            EnableTotalRecordCount: false
        };
        return apiClient.getItems(apiClient.getCurrentUserId(), options).then(function (result) {
            var images = result.Items.map(function (i) {
                return {
                    Id: i.Id,
                    tag: i.BackdropImageTags[0],
                    ServerId: i.ServerId
                };
            });
            cache[key] = JSON.stringify(images);
            return images;
        });
    }

    function showBackdrop(type, parentId) {
        var apiClient = window.ApiClient;

        if (apiClient) {
            getBackdropItemIds(apiClient, apiClient.getCurrentUserId(), type, parentId).then(function (images) {
                if (images.length) {
                    backdrop.setBackdrops(images.map(function (i) {
                        i.BackdropImageTags = [i.tag];
                        return i;
                    }));
                } else {
                    backdrop.clear();
                }
            });
        }
    }

    var cache = {};
    pageClassOn("pageshow", "page", function () {
        var page = this;

        if (!page.classList.contains("selfBackdropPage")) {
            if (page.classList.contains("backdropPage")) {
                if (enabled()) {
                    var type = page.getAttribute("data-backdroptype");
                    var parentId = page.classList.contains("globalBackdropPage") ? "" : libraryMenu.getTopParentId();
                    showBackdrop(type, parentId);
                } else {
                    page.classList.remove("backdropPage");
                    backdrop.clear();
                }
            } else {
                backdrop.clear();
            }
        }
    });
});
