import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { DeviceInfo } from '@jellyfin/sdk/lib/generated-client/models/device-info';
import type { SessionInfo } from '@jellyfin/sdk/lib/generated-client/models/session-info';

const BASE_DEVICE_IMAGE_URL = 'assets/img/devices/';

// audit note: this module is expected to return safe text for use in HTML
function getWebDeviceIcon(browser: string | null | undefined) {
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

export function getDeviceIcon(info: DeviceInfo | SessionInfo) {
    switch ((info as DeviceInfo).AppName || (info as SessionInfo).Client) {
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
        case 'Home Assistant':
            return BASE_DEVICE_IMAGE_URL + 'home-assistant.svg';
        case 'Jellyfin Roku':
            return BASE_DEVICE_IMAGE_URL + 'roku.svg';
        case 'Finamp':
            return BASE_DEVICE_IMAGE_URL + 'finamp.svg';
        case 'Jellyfin Web':
            return getWebDeviceIcon((info as DeviceInfo).Name || (info as SessionInfo).DeviceName);
        default:
            if (info.Capabilities?.IconUrl) {
                try {
                    return new URL(info.Capabilities.IconUrl).toString();
                } catch (err) {
                    console.error('[getDeviceIcon] device capabilities has invalid IconUrl', info, err);
                }
            }
            return BASE_DEVICE_IMAGE_URL + 'other.svg';
    }
}

export function getLibraryIcon(library: string | null | undefined) {
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

export function getItemTypeIcon(itemType: BaseItemKind | string) {
    switch (itemType) {
        case BaseItemKind.MusicAlbum:
            return 'album';
        case BaseItemKind.MusicArtist:
        case BaseItemKind.Person:
            return 'person';
        case BaseItemKind.Audio:
            return 'audiotrack';
        case BaseItemKind.Movie:
            return 'movie';
        case BaseItemKind.Episode:
        case BaseItemKind.Series:
            return 'tv';
        case BaseItemKind.Program:
            return 'live_tv';
        case BaseItemKind.Book:
            return 'book';
        case BaseItemKind.Folder:
            return 'folder';
        case BaseItemKind.BoxSet:
            return 'collections';
        case BaseItemKind.Playlist:
            return 'view_list';
        case BaseItemKind.Photo:
            return 'photo';
        case BaseItemKind.PhotoAlbum:
            return 'photo_album';
        default:
            return 'folder';
    }
}

export default {
    getDeviceIcon,
    getLibraryIcon,
    getItemTypeIcon
};
