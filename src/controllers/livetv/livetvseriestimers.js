define(["datetime", "cardBuilder", "imageLoader", "apphost", "loading", "paper-icon-button-light", "emby-button"], function (datetime, cardBuilder, imageLoader, appHost, loading) {
    "use strict";

    function renderTimers(context, timers) {
        var html = "";
        appHost.supports("imageanalysis");
        html += cardBuilder.getCardsHtml({
            items: timers,
            shape: "auto",
            defaultShape: "portrait",
            showTitle: true,
            cardLayout: false,
            preferThumb: "auto",
            coverImage: true,
            overlayText: false,
            showSeriesTimerTime: true,
            showSeriesTimerChannel: true,
            centerText: true,
            overlayMoreButton: true,
            lines: 3
        });
        var elem = context.querySelector("#items");
        elem.innerHTML = html;
        imageLoader.lazyChildren(elem);
        loading.hide();
    }

    function reload(context, promise) {
        loading.show();
        promise.then(function (result) {
            renderTimers(context, result.Items);
        });
    }

    var query = {
        SortBy: "SortName",
        SortOrder: "Ascending"
    };
    return function (view, params, tabContent) {
        var timersPromise;
        var self = this;

        self.preRender = function () {
            timersPromise = ApiClient.getLiveTvSeriesTimers(query);
        };

        self.renderTab = function () {
            reload(tabContent, timersPromise);
        };
    };
});
