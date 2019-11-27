define(["events", "playbackManager", "pluginManager", "inputManager", "connectionManager", "userSettings"], function (events, playbackManager, pluginManager, inputManager, connectionManager, userSettings) {
    "use strict";

    function getMinIdleTime() {
        // Returns the minimum amount of idle time required before the screen saver can be displayed
        //time units used Millisecond
        return 180000;
    }

    var lastFunctionalEvent = 0;

    function getFunctionalEventIdleTime() {
        return new Date().getTime() - lastFunctionalEvent;
    }

    events.on(playbackManager, "playbackstop", function (e, stopInfo) {
        var state = stopInfo.state;
        if (state.NowPlayingItem && state.NowPlayingItem.MediaType == "Video") {
            lastFunctionalEvent = new Date().getTime();
        }
    });

    function getScreensaverPlugin(isLoggedIn) {

        var option;
        var defaultOption = isLoggedIn ? "backdropscreensaver" : "logoscreensaver";
        try {
            option = userSettings.get("screensaver", false);
        } catch (err) {
            option = null;
        }

        if (option === "none" || defaultOption === "none") {
            return null;
        }

        var plugin = pluginManager.ofType("screensaver").filter(function (i) {
            return i.id === option;
        })[0];

        return plugin = plugin || pluginManager.ofType("screensaver").filter(function (i) {
            return i.id === defaultOption;
        })[0];
    }

    function ScreenSaverManager() {

        var self = this;
        var activeScreenSaver;

        function showScreenSaver(screensaver) {

            if (activeScreenSaver) {
                throw new Error("An existing screensaver is already active.");
            }

            console.log("Showing screensaver " + screensaver.name);

            screensaver.show();
            activeScreenSaver = screensaver;

            if (screensaver.hideOnClick !== false) {
                window.addEventListener("click", hide, true);
            }
            if (screensaver.hideOnMouse !== false) {
                window.addEventListener("mousemove", hide, true);
            }
            if (screensaver.hideOnKey !== false) {
                window.addEventListener("keydown", hide, true);
            }
        }

        function hide() {
            if (activeScreenSaver) {
                console.log("Hiding screensaver");
                activeScreenSaver.hide();
                activeScreenSaver = null;
            }

            window.removeEventListener("click", hide, true);
            window.removeEventListener("mousemove", hide, true);
            window.removeEventListener("keydown", hide, true);
        }

        self.isShowing = function () {
            return activeScreenSaver != null;
        };

        self.show = function () {
            var isLoggedIn;
            var apiClient = connectionManager.currentApiClient();

            if (apiClient && apiClient.isLoggedIn()) {
                isLoggedIn = true;
            }

            var screensaver = getScreensaverPlugin(isLoggedIn);

            if (screensaver) {
                showScreenSaver(screensaver);
            }
        };

        self.hide = function () {
            hide();
        };

        function onInterval() {

            if (self.isShowing()) {
                return;
            }

            if (inputManager.idleTime() < getMinIdleTime()) {
                return;
            }

            if (getFunctionalEventIdleTime < getMinIdleTime()) {
                return;
            }

            if (playbackManager.isPlayingVideo()) {
                return;
            }

            self.show();
        }

        setInterval(onInterval, 10000);
    }

    return new ScreenSaverManager();
});
