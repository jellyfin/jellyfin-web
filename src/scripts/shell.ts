// TODO: This seems like a good candidate for deprecation
export default {
    enableFullscreen: function() {
        if (window.NativeShell?.enableFullscreen) {
            window.NativeShell.enableFullscreen();
        }
    },
    disableFullscreen: function() {
        if (window.NativeShell?.disableFullscreen) {
            window.NativeShell.disableFullscreen();
        }
    },
    openClientSettings: () => {
        if (window.NativeShell?.openClientSettings) {
            window.NativeShell.openClientSettings();
        }
    },
    openDownloadManager: () => {
        if (window.NativeShell?.openDownloadManager) {
            window.NativeShell.openDownloadManager();
        }
    },
    openUrl: function(url: string, target?: string) {
        if (window.NativeShell?.openUrl) {
            window.NativeShell.openUrl(url, target);
        } else {
            window.open(url, target || '_blank');
        }
    },
    updateMediaSession(mediaInfo: NativeShellMediaInfo) {
        if (window.NativeShell?.updateMediaSession) {
            window.NativeShell.updateMediaSession(mediaInfo);
        }
    },
    hideMediaSession() {
        if (window.NativeShell?.hideMediaSession) {
            window.NativeShell.hideMediaSession();
        }
    },
    /**
     * Notify the NativeShell about volume level changes.
     * Useful for e.g. remote playback.
     */
    updateVolumeLevel(volume: number) {
        if (window.NativeShell?.updateVolumeLevel) {
            window.NativeShell.updateVolumeLevel(volume);
        }
    },
    /**
     * Download specified files with NativeShell if possible
     *
     * @returns true on success
     */
    downloadFiles(items: NativeShellDownloadItem[]) {
        if (window.NativeShell?.downloadFiles) {
            window.NativeShell.downloadFiles(items);
            return true;
        }
        const downloadFile = window.NativeShell?.downloadFile;
        if (downloadFile) {
            items.forEach(item => {
                downloadFile(item);
            });
            return true;
        }
        return false;
    }
};
