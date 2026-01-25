export interface MediaInfo {
    title?: string;
    artist?: string;
    album?: string;
    imageUrl?: string;
    [key: string]: any;
}

export interface DownloadItem {
    url: string;
    name?: string;
    [key: string]: any;
}

const shell = {
    enableFullscreen: function (): void {
        window.NativeShell?.enableFullscreen?.();
    },
    disableFullscreen: function (): void {
        window.NativeShell?.disableFullscreen?.();
    },
    openClientSettings: (): void => {
        window.NativeShell?.openClientSettings?.();
    },
    openDownloadManager: (): void => {
        window.NativeShell?.openDownloadManager?.();
    },
    openUrl: function (url: string, target?: string): void {
        if (window.NativeShell?.openUrl) {
            window.NativeShell.openUrl(url, target);
        } else {
            window.open(url, target || '_blank');
        }
    },
    updateMediaSession(mediaInfo: MediaInfo): void {
        window.NativeShell?.updateMediaSession?.(mediaInfo);
    },
    hideMediaSession(): void {
        window.NativeShell?.hideMediaSession?.();
    },
    /**
     * Notify the NativeShell about volume level changes.
     * Useful for e.g. remote playback.
     */
    updateVolumeLevel(volume: number): void {
        window.NativeShell?.updateVolumeLevel?.(volume);
    },
    /**
     * Download specified files with NativeShell if possible
     *
     * @returns true on success
     */
    downloadFiles(items: DownloadItem[]): boolean {
        if (window.NativeShell?.downloadFiles) {
            window.NativeShell.downloadFiles(items);
            return true;
        }
        if (window.NativeShell?.downloadFile) {
            items.forEach(item => {
                window.NativeShell?.downloadFile?.(item);
            });
            return true;
        }
        return false;
    }
};

export default shell;
