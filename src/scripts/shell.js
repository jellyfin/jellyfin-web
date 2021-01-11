// TODO: This seems like a good candidate for deprecation
export default {
    enableFullscreen: function() {
        window.NativeShell?.enableFullscreen();
    },
    disableFullscreen: function() {
        window.NativeShell?.disableFullscreen();
    },
    openUrl: function(url, target) {
        if (window.NativeShell) {
            window.NativeShell.openUrl(url, target);
        } else {
            window.open(url, target || '_blank');
        }
    },
    updateMediaSession(mediaInfo) {
        window.NativeShell?.updateMediaSession(mediaInfo);
    },
    hideMediaSession() {
        window.NativeShell?.hideMediaSession();
    },
    /**
     * Notify the NativeShell about volume level changes.
     * Useful for e.g. remote playback.
     */
    updateVolumeLevel(volume) {
        window.NativeShell?.updateVolumeLevel(volume);
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
