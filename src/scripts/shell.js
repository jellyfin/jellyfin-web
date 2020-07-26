// TODO: This seems like a good candidate for deprecation
export default {
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
