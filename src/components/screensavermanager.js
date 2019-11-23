define(['events', 'playbackManager'], function (events, playbackManager) {

    function getMinIdleTime() {
        // Returns the minimum amount of idle time required before the screen saver can be displayed
        //return 3000;
        return 180000;
    }

    var lastFunctionalEvent = 0;
    function getFunctionalEventIdleTime() {
        return new Date().getTime() - lastFunctionalEvent;
    }

    events.on(playbackManager, 'playbackstop', function (e, stopInfo) {
        var state = stopInfo.state;
        if (state.NowPlayingItem && state.NowPlayingItem.MediaType == 'Video') {
            lastFunctionalEvent = new Date().getTime();
        }
    });

    function ScreenSaverManager() {

        var self = this;
        var activeScreenSaver;

        function showScreenSaver(screensaver) {

            if (activeScreenSaver) {
                throw new Error('An existing screensaver is already active.');
            }

            console.log('Showing screensaver ' + screensaver.name);

            screensaver.show();
            activeScreenSaver = screensaver;

            if (screensaver.hideOnClick !== false) {
                window.addEventListener('click', hide, true);
            }
            if (screensaver.hideOnMouse !== false) {
                window.addEventListener('mousemove', hide, true);
            }
            if (screensaver.hideOnKey !== false) {
                window.addEventListener('keydown', hide, true);
            }
        }

        function hide() {
            if (activeScreenSaver) {
                console.log('Hiding screensaver');
                activeScreenSaver.hide();
                activeScreenSaver = null;
            }

            window.removeEventListener('click', hide, true);
            window.removeEventListener('mousemove', hide, true);
            window.removeEventListener('keydown', hide, true);
        }

        self.isShowing = function () {
            return activeScreenSaver != null;
        };

        self.show = function () {
            var screensavers = Emby.PluginManager.ofType('screensaver');

            require(['connectionManager'], function (connectionManager) {

                var server = connectionManager.currentLoggedInServer();

                show(screensavers, server);
            });
        };

        function show(screensavers, currentServer) {

            if (currentServer) {

                var loggedInScreenSavers = screensavers.filter(function (screensaver) {
                    return !screensaver.supportsAnonymous;
                });

                if (loggedInScreenSavers.length) {
                    screensavers = loggedInScreenSavers;
                }

            } else {

                screensavers = screensavers.filter(function (screensaver) {
                    return screensaver.supportsAnonymous;
                });
            }

            // Perform some other filter here to get the configured screensaver

            var current = screensavers.length ? screensavers[0] : null;
            if (current) {
                showScreenSaver(current);
            }
        }

        self.hide = function () {
            hide();
        };

        function onInterval() {

            if (self.isShowing()) {
                return;
            }

            require(['inputmanager'], function (inputmanager) {

                if (inputmanager.idleTime() < getMinIdleTime()) {
                    return;
                }

                if (getFunctionalEventIdleTime < getMinIdleTime()) {
                    return;
                }

                if (playbackManager.isPlayingVideo()) {
                    return;
                }

                self.show();
            });
        }

        setInterval(onInterval, 10000);
    }

    return new ScreenSaverManager();
});