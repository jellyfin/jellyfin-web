const BASE_DEVICE_IMAGE_URL = 'assets/img/devices/';

function getWebDeviceIcon(browser) {
    switch (browser) {
        case 'Opera':
        case 'Opera TV':
        case 'Opera Android':
            return BASE_DEVICE_IMAGE_URL + 'opera.svg';
        case 'Chrome':
        case 'Chrome Android':
            return BASE_DEVICE_IMAGE_URL + 'chrome.svg';
        case 'Firefox':
        case 'Firefox Android':
            return BASE_DEVICE_IMAGE_URL + 'firefox.svg';
        case 'Safari':
        case 'Safari iPad':
        case 'Safari iPhone':
            return BASE_DEVICE_IMAGE_URL + 'safari.svg';
        case 'Edge Chromium':
        case 'Edge Chromium Android':
        case 'Edge Chromium iPad':
        case 'Edge Chromium iPhone':
            return BASE_DEVICE_IMAGE_URL + 'edgechromium.svg';
        case 'Edge':
            return BASE_DEVICE_IMAGE_URL + 'edge.svg';
        case 'Internet Explorer':
            return BASE_DEVICE_IMAGE_URL + 'msie.svg';
        default:
            return BASE_DEVICE_IMAGE_URL + 'html5.svg';
    }
}

/* eslint-disable indent */

    export function getDeviceIcon(device) {
        switch (device.AppName || device.Client) {
            case 'Samsung Smart TV':
                return BASE_DEVICE_IMAGE_URL + 'samsung.svg';
            case 'Xbox One':
                return BASE_DEVICE_IMAGE_URL + 'xbox.svg';
            case 'Sony PS4':
                return BASE_DEVICE_IMAGE_URL + 'playstation.svg';
            case 'Kodi':
            case 'Kodi JellyCon':
                return BASE_DEVICE_IMAGE_URL + 'kodi.svg';
            case 'Jellyfin Android':
            case 'AndroidTV':
            case 'Android TV':
                return BASE_DEVICE_IMAGE_URL + 'android.svg';
            case 'Jellyfin Mobile (iOS)':
            case 'Jellyfin Mobile (iPadOS)':
            case 'Jellyfin iOS':
            case 'Infuse':
                return BASE_DEVICE_IMAGE_URL + 'apple.svg';
            case 'Jellyfin Web':
                return getWebDeviceIcon(device.Name || device.DeviceName);
            default:
                return BASE_DEVICE_IMAGE_URL + 'other.svg';
        }
    }

    export function getLibraryIcon(library) {
        switch (library) {
            case 'movies':
                return 'video_library';
            case 'music':
                return 'library_music';
            case 'photos':
                return 'photo_library';
            case 'livetv':
                return 'live_tv';
            case 'tvshows':
                return 'tv';
            case 'trailers':
                return 'local_movies';
            case 'homevideos':
                return 'photo_library';
            case 'musicvideos':
                return 'music_video';
            case 'books':
                return 'library_books';
            case 'channels':
                return 'videocam';
            case 'playlists':
                return 'view_list';
            default:
                return 'folder';
        }
    }

/* eslint-enable indent */

export default {
    getDeviceIcon: getDeviceIcon,
    getLibraryIcon: getLibraryIcon
};
