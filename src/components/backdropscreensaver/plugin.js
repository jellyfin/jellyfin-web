define(["connectionManager"], function (connectionManager) {

    return function () {

        var self = this;

        self.name = "Backdrop ScreenSaver";
        self.type = "screensaver";
        self.id = "backdropscreensaver";
        self.supportsAnonymous = false;

        var currentSlideshow;

        self.show = function () {

            var query = {
                ImageTypes: "Backdrop",
                EnableImageTypes: "Backdrop",
                IncludeItemTypes: "Movie,Series,MusicArtist",
                SortBy: "Random",
                Recursive: true,
                Fields: "Taglines",
                ImageTypeLimit: 1,
                StartIndex: 0,
                Limit: 200
            };

            var apiClient = connectionManager.currentApiClient();
            apiClient.getItems(apiClient.getCurrentUserId(), query).then(function (result) {

                if (result.Items.length) {

                    require(["slideshow"], function (slideshow) {

                        var newSlideShow = new slideshow({
                            showTitle: true,
                            cover: true,
                            items: result.Items
                        });

                        newSlideShow.show();
                        currentSlideshow = newSlideShow;
                    });
                }
            });
        };

        self.hide = function () {

            if (currentSlideshow) {
                currentSlideshow.hide();
                currentSlideshow = null;
            }
        };
    }
});
