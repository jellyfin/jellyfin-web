import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import type { DeviceInfo } from '@jellyfin/sdk/lib/generated-client/models/device-info';
import type { SessionInfo } from '@jellyfin/sdk/lib/generated-client/models/session-info';

import { logger } from './logger';

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
        case 'Titan OS':
            return BASE_DEVICE_IMAGE_URL + 'titanos.svg';
        case 'Vega OS':
            return BASE_DEVICE_IMAGE_URL + 'firetv.svg';
        default:
            return BASE_DEVICE_IMAGE_URL + 'html5.svg';
    }
}

export function getDeviceIcon(info: DeviceInfo | SessionInfo) {
    switch ((info as DeviceInfo).AppName || (info as SessionInfo).Client) {
        case 'Samsung Smart TV':
            return BASE_DEVICE_IMAGE_URL + 'samsungtv.svg';
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
        case 'Jellyfin iPadOS':
        case 'Jellyfin tvOS':
        case 'Swiftfin iPadOS':
        case 'Swiftfin iOS':
        case 'Swiftfin tvOS':
        case 'Infuse':
        case 'Infuse-Direct':
        case 'Infuse-Library':
            return BASE_DEVICE_IMAGE_URL + 'apple.svg';
        case 'Home Assistant':
            return BASE_DEVICE_IMAGE_URL + 'home-assistant.svg';
        case 'Jellyfin for WebOS':
        case 'LG Smart TV':
            return BASE_DEVICE_IMAGE_URL + 'webos.svg';
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
                    logger.error(
                        '[getDeviceIcon] Device capabilities has invalid IconUrl',
                        { component: 'Image' },
                        err as Error
                    );
                }
            }
            return BASE_DEVICE_IMAGE_URL + 'other.svg';
    }
}

export function getLibraryIcon(library: CollectionType | string | null | undefined) {
    switch (library) {
        case CollectionType.Movies:
            return 'movie';
        case CollectionType.Music:
            return 'music_note';
        case CollectionType.Homevideos:
        case CollectionType.Photos:
            return 'photo';
        case CollectionType.Livetv:
            return 'live_tv';
        case CollectionType.Tvshows:
            return 'tv';
        case CollectionType.Trailers:
            return 'theaters';
        case CollectionType.Musicvideos:
            return 'music_video';
        case CollectionType.Books:
            return 'book';
        case CollectionType.Boxsets:
            return 'video_library';
        case CollectionType.Playlists:
            return 'queue';
        case 'channels':
            return 'videocam';
        case undefined:
            return 'quiz';
        default:
            return 'folder';
    }
}

export function getItemTypeIcon(itemType: BaseItemKind | string | undefined, defaultIcon?: string) {
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
            return 'video_library';
        case BaseItemKind.Playlist:
            return 'queue';
        case BaseItemKind.Photo:
            return 'photo';
        case BaseItemKind.PhotoAlbum:
            return 'photo_album';
        default:
            return defaultIcon;
    }
}

export default {
    getDeviceIcon,
    getLibraryIcon,
    getItemTypeIcon
};
