define(['events', 'dom', 'apphost', 'browser'], function (events, dom, appHost, browser) {
    'use strict';

    function fullscreenManager() {

    }

    fullscreenManager.prototype.requestFullscreen = function (element) {

        element = element || document.documentElement;

        if (element.requestFullscreen) {
            element.requestFullscreen();
            return;
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
            return;
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
            return;
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
            return;
        }

        // Hack - This is only available for video elements in ios safari
        if (element.tagName !== 'VIDEO') {
            element = document.querySelector('video') || element;
        }
        if (element.webkitEnterFullscreen) {
            element.webkitEnterFullscreen();
        }
    };

    fullscreenManager.prototype.exitFullscreen = function () {

        if (!this.isFullScreen()) {
            return;
        }
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.webkitCancelFullscreen) {
            document.webkitCancelFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    };

    // TODO: use screenfull.js
    fullscreenManager.prototype.isFullScreen = function () {
        return document.fullscreen ||
            document.mozFullScreen ||
            document.webkitIsFullScreen ||
            document.msFullscreenElement || /* IE/Edge syntax */
            document.fullscreenElement || /* Standard syntax */
            document.webkitFullscreenElement || /* Chrome, Safari and Opera syntax */
            document.mozFullScreenElement; /* Firefox syntax */
    };

    var manager = new fullscreenManager();

    function onFullScreenChange() {
        events.trigger(manager, 'fullscreenchange');
    }

    dom.addEventListener(document, 'fullscreenchange', onFullScreenChange, {
        passive: true
    });

    dom.addEventListener(document, 'webkitfullscreenchange', onFullScreenChange, {
        passive: true
    });

    dom.addEventListener(document, 'mozfullscreenchange', onFullScreenChange, {
        passive: true
    });

    function isTargetValid(target) {
        return !dom.parentWithTag(target, ['BUTTON', 'INPUT', 'TEXTAREA']);
    }
    if (appHost.supports("fullscreenchange") && (browser.edgeUwp || -1 !== navigator.userAgent.toLowerCase().indexOf("electron"))) {

        dom.addEventListener(window, 'dblclick', function (e) {

            if (isTargetValid(e.target)) {
                if (manager.isFullScreen()) {
                    manager.exitFullscreen();
                } else {
                    manager.requestFullscreen();
                }
            }

        }, {
            passive: true
        });
    }

    return manager;
});
