define(['tvguide'], function (TvGuide) {
    'use strict';

    return function (view, params, tabContent) {
        var guideInstance;
        var self = this;

        self.renderTab = function () {
            if (!guideInstance) {
                guideInstance = new TvGuide({
                    element: tabContent,
                    serverId: ApiClient.serverId()
                });
            }
        };

        self.onShow = function () {
            if (guideInstance) {
                guideInstance.resume();
            }
        };

        self.onHide = function () {
            if (guideInstance) {
                guideInstance.pause();
            }
        };
    };
});
