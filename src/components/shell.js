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
