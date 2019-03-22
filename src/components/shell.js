define([], function () {
    'use strict';

    return {
        openUrl: function (url, target) {
            if (window.NativeShell) {
                window.NativeShell.openUrl(url, target);
            } else {
                window.open(url, target || '_blank');
            }
            
        },
        canExec: false,
        exec: function (options) {
            // options.path
            // options.arguments
            return Promise.reject();
        },
        enableFullscreen: function () {
            if (window.NativeShell) {
                window.NativeShell.enableFullscreen();
            }
        },
        disableFullscreen: function () {
            if (window.NativeShell) {
                window.NativeShell.disableFullscreen();
            }
        }
    };
});