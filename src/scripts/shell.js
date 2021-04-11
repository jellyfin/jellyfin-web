// TODO: This seems like a good candidate for deprecation
export default {
    enableFullscreen: function() {
        if (window.NativeShell && window.NativeShell.enableFullscreen) {
            window.NativeShell.enableFullscreen();
        }
    },
    disableFullscreen: function() {
        if (window.NativeShell && window.NativeShell.disableFullscreen) {
            window.NativeShell.disableFullscreen();
        }
    },
    openUrl: function(url, target) {
        if (window.NativeShell) {
            window.NativeShell.openUrl(url, target);
        } else {
            window.open(url, target || '_blank');
        }
    },
    updateMediaSession(mediaInfo) {
        if (window.NativeShell && window.NativeShell.updateMediaSession) {
            window.NativeShell.updateMediaSession(mediaInfo);
        }
    },
    hideMediaSession() {
        if (window.NativeShell && window.NativeShell.hideMediaSession) {
            window.NativeShell.hideMediaSession();
        }
    },
    /**
     * Notify the NativeShell about volume level changes.
     * Useful for e.g. remote playback.
     */
    updateVolumeLevel(volume) {
        if (window.NativeShell && window.NativeShell.updateVolumeLevel) {
            window.NativeShell.updateVolumeLevel(volume);
        }
    },
    /**
     * Download specified files with NativeShell if possible
     *
     * @returns true on success
     */
    downloadFiles(items) {
        if (window.NativeShell) {
            items.forEach(item => window.NativeShell.downloadFile(item));
            return true;
        }
        return false;
    }
};
