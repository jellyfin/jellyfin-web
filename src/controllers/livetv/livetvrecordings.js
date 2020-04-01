define(["layoutManager", "loading", "cardBuilder", "apphost", "imageLoader", "scripts/livetvcomponents", "listViewStyle", "emby-itemscontainer"], function (layoutManager, loading, cardBuilder, appHost, imageLoader) {
    "use strict";

    function renderRecordings(elem, recordings, cardOptions, scrollX) {
        if (!elem) {
            return;
        }

        if (recordings.length) {
            elem.classList.remove("hide");
        } else {
            elem.classList.add("hide");
        }

        var recordingItems = elem.querySelector(".recordingItems");

        if (scrollX) {
            recordingItems.classList.add("scrollX");
            recordingItems.classList.add("hiddenScrollX");
            recordingItems.classList.remove("vertical-wrap");
        } else {
            recordingItems.classList.remove("scrollX");
            recordingItems.classList.remove("hiddenScrollX");
            recordingItems.classList.add("vertical-wrap");
        }

        appHost.supports("imageanalysis");
        recordingItems.innerHTML = cardBuilder.getCardsHtml(Object.assign({
            items: recordings,
            shape: scrollX ? "autooverflow" : "auto",
            defaultShape: scrollX ? "overflowBackdrop" : "backdrop",
            showTitle: true,
            showParentTitle: true,
            coverImage: true,
            cardLayout: false,
            centerText: true,
            allowBottomPadding: !scrollX,
            preferThumb: "auto",
            overlayText: false
        }, cardOptions || {}));
        imageLoader.lazyChildren(recordingItems);
    }

    function renderLatestRecordings(context, promise) {
        promise.then(function (result) {
            renderRecordings(context.querySelector("#latestRecordings"), result.Items, {
                showYear: true,
                lines: 2
            }, false);
            loading.hide();
        });
    }

    function renderRecordingFolders(context, promise) {
        promise.then(function (result) {
            renderRecordings(context.querySelector("#recordingFolders"), result.Items, {
                showYear: false,
                showParentTitle: false
            }, false);
        });
    }

    function onMoreClick(e) {
        var type = this.getAttribute("data-type");
        var serverId = ApiClient.serverId();

        switch (type) {
            case "latest":
                Dashboard.navigate("list.html?type=Recordings&serverId=" + serverId);
        }
    }

    return function (view, params, tabContent) {
        function enableFullRender() {
            return new Date().getTime() - lastFullRender > 300000;
        }

        var foldersPromise;
        var latestPromise;
        var self = this;
        var lastFullRender = 0;
        var moreButtons = tabContent.querySelectorAll(".more");

        for (var i = 0, length = moreButtons.length; i < length; i++) {
            moreButtons[i].addEventListener("click", onMoreClick);
        }

        self.preRender = function () {
            if (enableFullRender()) {
                latestPromise = ApiClient.getLiveTvRecordings({
                    UserId: Dashboard.getCurrentUserId(),
                    Limit: 12,
                    Fields: "CanDelete,PrimaryImageAspectRatio,BasicSyncInfo",
                    EnableTotalRecordCount: false,
                    EnableImageTypes: "Primary,Thumb,Backdrop"
                });
                foldersPromise = ApiClient.getRecordingFolders(Dashboard.getCurrentUserId());
            }
        };

        self.renderTab = function () {
            if (enableFullRender()) {
                loading.show();
                renderLatestRecordings(tabContent, latestPromise);
                renderRecordingFolders(tabContent, foldersPromise);
                lastFullRender = new Date().getTime();
            }
        };
    };
});
